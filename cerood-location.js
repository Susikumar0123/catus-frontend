/* Cerood browsing location bridge. Checkout/order addresses remain independent. */
(function () {
  'use strict';
  const KEY='cerood_global_location_v1';
  const STORES={renewed:'cerood_renewed_delivery_location',cosmetics:'cerood_cosmetics_delivery_location',clothing:'cerood_clothing_delivery_location'};
  const LABELS=['locationText','mobileLocationText','renewedDeliveryLocation','beautyDeliveryLocation','fashionDeliveryLocation'];
  const nativeSet=Storage.prototype.setItem;
  let pending=false;
  function read(k){try{const s=localStorage.getItem(k);if(!s)return null;try{return JSON.parse(s)}catch(_){return s}}catch(_){return null}}
  function normal(v){
    if(!v)return null;
    if(typeof v==='string'){
      const pin=(v.match(/\b\d{6}\b/)||[])[0]||'';
      const a=v.replace(/\s*[-,]\s*\d{6}\s*$/,'').split(',').map(x=>x.trim());
      return {area:a[0]||'',city:'',district:a[1]||'',state:'',pincode:pin};
    }
    if(typeof v!=='object'||Array.isArray(v))return null;
    return {area:String(v.area||v.village||v.name||v.city||''),city:String(v.city||''),district:String(v.district||''),state:String(v.state||''),pincode:String(v.pincode||'')};
  }
  function good(v){return !!(v&&(v.area||v.city||v.pincode));}
  function home(){
    const area=localStorage.getItem('catus_location_name')||'';
    const pin=localStorage.getItem('catus_pincode')||'';
    if(!area&&!pin)return null;
    return normal({area,district:localStorage.getItem('catus_district_name'),state:localStorage.getItem('catus_state_name'),pincode:pin});
  }
  function get(){return normal(read(KEY))||normal(read('cerood_selected_location'))||home()||normal(read(STORES.renewed))||normal(read(STORES.cosmetics))||normal(read(STORES.clothing))||normal(read('cerood_clothing_selected_location'));}
  function label(v){return v?[v.area||v.city,v.district||(!v.area?v.city:''),v.pincode].filter(Boolean).join(', '):'';}
  function paint(){
    const v=get(),str=label(v);if(!str)return;
    LABELS.forEach(id=>{const el=document.getElementById(id);if(el){el.textContent=str;el.title=str;}});
    // Home Services controls its own location text and booking state: never replace those.
  }
  function save(v){v=normal(v);if(!good(v))return false;nativeSet.call(localStorage,KEY,JSON.stringify(v));paint();window.dispatchEvent(new CustomEvent('cerood-global-location-changed',{detail:v}));return true;}
  function fromHome(){const v=home();if(good(v))save(v);}
  function fromStore(kind){const v=normal(read(STORES[kind]));if(good(v))save(v);}
  // Observe existing location saves, without changing legacy keys or checkout addresses.
  try{Storage.prototype.setItem=function(k,v){const r=nativeSet.call(this,k,v);if(this===localStorage&&/^catus_(location_name|district_name|state_name|pincode)$/.test(k)){
    if(!pending){pending=true;queueMicrotask(()=>{pending=false;fromHome()});}
  }return r;};}catch(_){}
  window.CeroodLocation={get,set:save,refresh:paint,label};
  window.addEventListener('cerood-location-updated',()=>{const v=normal(read('cerood_selected_location'));if(good(v))save(v);});
  window.addEventListener('cerood-renewed-location-changed',()=>fromStore('renewed'));
  window.addEventListener('cerood-cosmetics-location-changed',()=>fromStore('cosmetics'));
  window.addEventListener('cerood-clothing-location-changed',()=>fromStore('clothing'));
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key==='cerood_selected_location'||e.key?.startsWith('catus_'))paint();});
  function init(){
    // Existing Home Services location is authoritative on the Home Services page.
    if(/\/home-services(?:\.html)?$/.test(location.pathname)&&good(home()))fromHome();
    paint();
    // Existing manual location forms remain intact. Add optional browser GPS to the three store forms.
    const kind=/\/renewed(?:\.html)?$/.test(location.pathname)?'renewed':/\/cosmetics(?:\.html)?$/.test(location.pathname)?'cosmetics':/\/clothing(?:\.html)?$/.test(location.pathname)?'clothing':null;
    if(!kind)return;
    const observer=new MutationObserver(()=>{
      const panel=document.querySelector('#rn-delivery-dialog form');
      if(!panel||panel.querySelector('[data-cerood-gps]'))return;
      const btn=document.createElement('button');btn.type='button';btn.dataset.ceroodGps='1';btn.textContent='◎ Use current location (GPS)';
      btn.style.cssText='border:1px solid #c7c4dd;background:#f7f5ff;color:#342b72;border-radius:9px;padding:12px;font:600 13px Inter,Arial,sans-serif;cursor:pointer';
      const msg=document.createElement('small');msg.setAttribute('role','status');msg.style.cssText='font:12px Inter,Arial,sans-serif;color:#475569';
      panel.insertBefore(btn,panel.querySelector('button[type="submit"]'));panel.insertBefore(msg,btn.nextSibling);
      btn.addEventListener('click',()=>{
        if(!navigator.geolocation){msg.textContent='GPS unavailable. Enter your location manually.';return;}
        btn.disabled=true;msg.textContent='Detecting location…';
        navigator.geolocation.getCurrentPosition(async pos=>{
          try{
            const url='https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat='+encodeURIComponent(pos.coords.latitude)+'&lon='+encodeURIComponent(pos.coords.longitude);
            const res=await fetch(url,{headers:{Accept:'application/json'}});if(!res.ok)throw Error('Lookup unavailable');
            const data=await res.json(),a=data.address||{};
            const area=a.village||a.suburb||a.neighbourhood||a.hamlet||a.town||a.city||'';
            const city=a.city||a.town||a.municipality||a.county||area;
            const pin=(a.postcode||'').match(/\b\d{6}\b/);
            if(!area&&!city)throw Error('Area unavailable');
            panel.elements.namedItem('area').value=area;
            panel.elements.namedItem('city').value=city;
            if(pin)panel.elements.namedItem('pincode').value=pin[0];
            msg.textContent='Check area, city and 6-digit pincode, then tap Save location.';
          }catch(e){msg.textContent='Could not resolve GPS address. Enter location manually.';}
          finally{btn.disabled=false;}
        },()=>{btn.disabled=false;msg.textContent='Location permission denied/unavailable. Enter manually.';},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('pageshow',paint);
})();
