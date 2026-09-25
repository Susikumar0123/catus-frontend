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
      // Reuse Home Services' existing database-backed village/town/pincode search.
      const areaInput=panel.elements.namedItem('area');
      const cityInput=panel.elements.namedItem('city');
      const pinInput=panel.elements.namedItem('pincode');
      if(areaInput&&cityInput&&pinInput){
        areaInput.setAttribute('autocomplete','off');
        areaInput.placeholder='Search village, town, area or pincode';
        const suggestions=document.createElement('div');
        suggestions.dataset.ceroodSuggestions='1';
        suggestions.setAttribute('role','listbox');
        suggestions.style.cssText='display:none;max-height:215px;overflow:auto;border:1px solid #d8d5e8;border-radius:9px;background:white;box-shadow:0 8px 20px #0001';
        areaInput.closest('label').insertAdjacentElement('afterend',suggestions);
        const searchStatus=document.createElement('small');
        searchStatus.setAttribute('role','status');
        searchStatus.style.cssText='font:12px Inter,Arial,sans-serif;color:#64748b';
        suggestions.insertAdjacentElement('afterend',searchStatus);
        let timer,request,serial=0,chosen=false;
        const clear=()=>{suggestions.replaceChildren();suggestions.style.display='none';};
        areaInput.addEventListener('input',()=>{
          chosen=false;clear();clearTimeout(timer);if(request)request.abort();
          const q=areaInput.value.trim();if(q.length<3){searchStatus.textContent='';return;}
          const seq=++serial;
          searchStatus.textContent='Searching locations…';
          timer=setTimeout(async()=>{
            request=new AbortController();
            try{
              const r=await fetch('https://catus-backend-d2js.onrender.com/api/search-locations?q='+encodeURIComponent(q),{signal:request.signal});
              if(!r.ok)throw Error('Location search unavailable');
              const data=await r.json();if(seq!==serial||!areaInput.isConnected)return;
              const items=data.success&&Array.isArray(data.locations)?data.locations:[];
              clear();searchStatus.textContent=items.length?'Select your location from suggestions.':'No matching location. You can enter the details manually.';
              items.slice(0,12).forEach(item=>{
                const row=document.createElement('button');row.type='button';row.setAttribute('role','option');
                row.textContent=[item.name,item.district,item.state,item.pincode].filter(Boolean).join(', ');
                row.style.cssText='display:block;width:100%;padding:11px;text-align:left;border:0;border-bottom:1px solid #eee;background:#fff;color:#171717;font:13px Inter,Arial,sans-serif;cursor:pointer';
                row.addEventListener('click',()=>{
                  areaInput.value=item.name||'';
                  cityInput.value=item.district||item.name||'';
                  if(/^\d{6}$/.test(String(item.pincode||'')))pinInput.value=String(item.pincode);
                  chosen=true;clear();searchStatus.textContent='Location selected. Check details, then Save location.';
                });suggestions.append(row);
              });if(items.length)suggestions.style.display='block';
            }catch(e){if(e.name!=='AbortError'&&seq===serial){clear();searchStatus.textContent='Search unavailable. Enter your location manually.';}}
          },400);
        });
        panel.addEventListener('submit',()=>{clearTimeout(timer);if(request)request.abort();clear();},{capture:true});
      }

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
  // Unified Change location popup: match the Home Services layout on main + 3 stores.
  // Home Services keeps its existing, fully integrated native modal.
  (function unifiedPopup(){
    const path=location.pathname;
    const isHome=/\/home-services(?:\.html)?$/.test(path);
    if(isHome)return;
    const kind=/\/renewed(?:\.html)?$/.test(path)?'renewed':/\/cosmetics(?:\.html)?$/.test(path)?'cosmetics':/\/clothing(?:\.html)?$/.test(path)?'clothing':null;
    const isMain=path==='/'||/\/index(?:\.html)?$/.test(path);
    if(!kind&&!isMain)return;
    const ADDRESS='cerood_manual_service_address_details';
    const css=`
      #ceroodUnifiedShade{position:fixed;inset:0;z-index:200010;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,Arial,sans-serif;color:#0f172a}
      #ceroodUnifiedShade *{box-sizing:border-box}
      #ceroodUnifiedShade .cu-card{background:#fff;width:min(460px,100%);max-height:calc(100dvh - 32px);overflow:auto;border-radius:16px;padding:24px;box-shadow:0 10px 30px #0003}
      #ceroodUnifiedShade .cu-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}
      #ceroodUnifiedShade h2{font-size:18px;font-weight:600;margin:0}
      #ceroodUnifiedShade .cu-close{border:0;border-radius:50%;background:#f5f3ff;color:#7c3aed;width:36px;height:36px;font-size:24px;line-height:1;cursor:pointer}
      #ceroodUnifiedShade .cu-search{display:flex;align-items:center;gap:10px;border:1.5px solid #cbd5e1;border-radius:10px;padding:12px 14px}
      #ceroodUnifiedShade .cu-search input{border:0;outline:0;width:100%;min-width:0;font-size:14px;background:#fff;color:#1e293b}
      #ceroodUnifiedShade .cu-action{width:100%;display:flex;align-items:center;gap:12px;padding:16px 0;border:0;border-bottom:1px solid #f1f5f9;background:transparent;text-align:left;color:#7c3aed;font-size:14px;font-weight:600;cursor:pointer}
      #ceroodUnifiedShade .cu-suggestions{max-height:180px;overflow:auto;margin-top:5px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:4px}
      #ceroodUnifiedShade .cu-suggestions:empty{display:none}
      #ceroodUnifiedShade .cu-suggestions button{display:block;width:100%;padding:11px;border:0;border-bottom:1px solid #e2e8f0;background:#fff;text-align:left;font-size:13px;cursor:pointer;color:#1e293b}
      #ceroodUnifiedShade .cu-saved{margin-top:16px;padding:14px;border:1px solid #d8c8ff;background:#faf8ff;border-radius:12px}
      #ceroodUnifiedShade .cu-buttons{display:flex;gap:10px;margin-top:13px}
      #ceroodUnifiedShade .cu-buttons button{flex:1;border:1px solid #7c3aed;background:#fff;color:#7c3aed;border-radius:8px;padding:10px;cursor:pointer;font-weight:600}
      #ceroodUnifiedShade .cu-buttons button:last-child{border-color:#fecaca;background:#fff5f5;color:#dc2626}
      #ceroodUnifiedShade .cu-form label{display:block;margin:12px 0 5px;font-size:13px;font-weight:600}
      #ceroodUnifiedShade .cu-form input{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:9px;font-size:14px}
      #ceroodUnifiedShade .cu-save{width:100%;padding:13px;margin-top:17px;border:0;border-radius:10px;background:#7c3aed;color:white;font-weight:700;cursor:pointer}
      #ceroodUnifiedShade .cu-status{font-size:12px;color:#64748b;margin:8px 0;line-height:1.5}
      #ceroodUnifiedShade .cu-secure{text-align:center;color:#0284c7;font-size:11px;margin-top:16px}
    `;
    let shade=null, controller=null, timer=null, seq=0, previousFocus=null, oldOverflow='';
    function address(){try{const a=JSON.parse(localStorage.getItem(ADDRESS)||'null');return a&&a.house&&a.village&&a.district&&a.state&&/^\d{6}$/.test(a.pincode)?a:null;}catch(_){return null;}}
    function close(){if(controller)controller.abort();clearTimeout(timer);seq++;if(shade)shade.remove();shade=null;document.body.style.overflow=oldOverflow;if(previousFocus?.focus)previousFocus.focus();}
    function frame(){
      previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
      shade=document.createElement('div');shade.id='ceroodUnifiedShade';shade.setAttribute('role','presentation');
      shade.innerHTML='<style>'+css+'</style><section class="cu-card" role="dialog" aria-modal="true" aria-label="Change location"></section>';
      document.body.append(shade);shade.addEventListener('click',e=>{if(e.target===shade)close()});
      return shade.querySelector('.cu-card');
    }
    function heading(card,title){card.innerHTML='<div class="cu-head"><h2></h2><button type="button" class="cu-close" aria-label="Close">×</button></div>';card.querySelector('h2').textContent=title;card.querySelector('.cu-close').onclick=close;}
    function apply(v){
      if(!v||!v.area&&!v.pincode)return;
      const clean=normal(v);save(clean);
      localStorage.setItem('cerood_selected_location',JSON.stringify(clean));
      if(kind){localStorage.setItem(STORES[kind],JSON.stringify(clean));window.dispatchEvent(new Event('cerood-'+kind+'-location-changed'));}
      // Home Services uses these legacy browsing keys; never touch cart/order address keys.
      for(const [k,value] of Object.entries({catus_location_name:clean.area,catus_district_name:clean.district,catus_state_name:clean.state,catus_pincode:clean.pincode}))localStorage.setItem(k,value||'');
      paint();
    }
    function showMain(){
      if(shade){close();return;}const card=frame();heading(card,'Change location');
      card.insertAdjacentHTML('beforeend',`<div class="cu-search"><span aria-hidden="true">⌕</span><input id="cuQuery" placeholder="Search village, area, town or pincode" autocomplete="off" aria-label="Search village, area, town or pincode"></div><div class="cu-suggestions" role="listbox"></div><p class="cu-status" role="status"></p><button type="button" class="cu-action" id="cuGps">⊙ &nbsp; Use current location</button><button type="button" class="cu-action" id="cuManual">✎ &nbsp; Enter address manually</button><div id="cuSaved"></div><div class="cu-secure">♢ Cerood Secure Location</div>`);
      const input=card.querySelector('#cuQuery'),results=card.querySelector('.cu-suggestions'),status=card.querySelector('.cu-status');
      function renderSaved(){const a=address(),slot=card.querySelector('#cuSaved');slot.replaceChildren();if(!a)return;const section=document.createElement('section');section.className='cu-saved';section.innerHTML='<div style="color:#15803d;font-size:12px;font-weight:700;margin-bottom:8px">● Saved service address</div><div class="cu-saved-text" style="font-size:13px;line-height:1.65;overflow-wrap:anywhere"></div><div class="cu-buttons"><button type="button">✎ Edit</button><button type="button">▤ Delete</button></div>';section.querySelector('.cu-saved-text').textContent=[a.house,a.village,a.district,a.state,a.pincode,a.landmark].filter(Boolean).join(', ');section.querySelectorAll('button')[0].onclick=()=>showManual(true);section.querySelectorAll('button')[1].onclick=()=>{if(!confirm('Delete your saved service address?'))return;localStorage.removeItem(ADDRESS);localStorage.removeItem('cerood_manual_service_address');renderSaved();};slot.append(section);}
      renderSaved();card.querySelector('#cuManual').onclick=()=>showManual(false);
      input.addEventListener('input',()=>{
        const q=input.value.trim();results.replaceChildren();status.textContent='';clearTimeout(timer);if(controller)controller.abort();const current=++seq;if(q.length<2)return;
        status.textContent='Searching locations…';timer=setTimeout(async()=>{
          controller=new AbortController();try{const r=await fetch('https://catus-backend-d2js.onrender.com/api/search-locations?q='+encodeURIComponent(q),{signal:controller.signal});if(!r.ok)throw Error('Search failed');const d=await r.json();if(current!==seq||!shade)return;const items=d.success&&Array.isArray(d.locations)?d.locations:[];status.textContent=items.length?'Select your location from suggestions.':'No matching location. Enter address manually.';
            items.slice(0,12).forEach(item=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.textContent=[item.name,item.district,item.state,item.pincode].filter(Boolean).join(', ');b.onclick=()=>{apply({area:item.name||'',city:item.district||'',district:item.district||'',state:item.state||'',pincode:item.pincode||''});close()};results.append(b)});
          }catch(e){if(e.name!=='AbortError'&&current===seq)status.textContent='Location search unavailable. Try manual entry.';}
        },350);
      });
      card.querySelector('#cuGps').onclick=()=>{
        if(!navigator.geolocation){status.textContent='GPS unavailable. Enter address manually.';return;}
        status.textContent='Detecting location…';navigator.geolocation.getCurrentPosition(async pos=>{
          try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat='+encodeURIComponent(pos.coords.latitude)+'&lon='+encodeURIComponent(pos.coords.longitude),{headers:{Accept:'application/json'}});if(!r.ok)throw Error('Reverse geocoding failed');const d=await r.json(),a=d.address||{};const v={area:a.village||a.hamlet||a.suburb||a.town||a.city||'',city:a.town||a.city||'',district:a.state_district||a.county||'',state:a.state||'',pincode:a.postcode||''};if(!v.area)throw Error('No area');apply(v);close();}catch(_){if(status.isConnected)status.textContent='Unable to identify GPS address. Enter manually.';}
        },()=>{status.textContent='Location permission denied or unavailable. Enter manually.';},{timeout:12000,maximumAge:60000});
      };
      input.focus();
    }
    function showManual(edit){
      if(shade)close();const card=frame();heading(card,edit?'Edit service address':'Enter address manually');
      card.insertAdjacentHTML('beforeend',`<form class="cu-form"><p class="cu-status">Enter the full address where you need service.</p><label>House / street address *<input name="house" required maxlength="160" autocomplete="street-address" placeholder="Door no, street, building"></label><label>Village / area / town *<input name="village" required maxlength="100"></label><label>District *<input name="district" required maxlength="100"></label><label>State *<input name="state" required maxlength="100"></label><label>PIN code *<input name="pincode" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric"></label><label>Landmark (optional)<input name="landmark" maxlength="140"></label><button type="submit" class="cu-save">Save &amp; Continue</button><p class="cu-status">Service and product delivery availability are confirmed separately.</p></form>`);
      const form=card.querySelector('form'),a=edit?address():null;
      for(const name of ['house','village','district','state','pincode','landmark'])form.elements[name].value=a?.[name]||(name==='state'?'Tamil Nadu':'');
      form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const v={};for(const name of ['house','village','district','state','pincode','landmark'])v[name]=form.elements[name].value.trim();localStorage.setItem(ADDRESS,JSON.stringify(v));localStorage.setItem('cerood_manual_service_address',[v.house,v.village,v.district,v.state,v.pincode,v.landmark].filter(Boolean).join(', '));apply({area:v.village,city:v.district,district:v.district,state:v.state,pincode:v.pincode});close();showMain();};
      form.elements.house.focus();
    }
    document.addEventListener('click',e=>{
      const target=e.target.closest(kind?'.cr-location':'#desktopLocationButton, #mobileLocationButton');
      if(!target)return;e.preventDefault();e.stopImmediatePropagation();showMain();
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&shade)close()});
    window.CeroodLocation.open=showMain;
  })();
})();
