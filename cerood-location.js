/* Cerood shared browsing location — independent from checkout/order addresses. */
(function () {
  'use strict';
  const KEY = 'cerood_global_location_v1';
  const LEGACY = 'cerood_selected_location';
  const IDS = ['locationText','mobileLocationText','renewedDeliveryLocation','beautyDeliveryLocation','fashionDeliveryLocation'];
  function parse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return raw; }
  }
  function normalize(x) {
    if (!x) return null;
    if (typeof x === 'string') {
      const pin = x.match(/\b\d{6}\b/);
      const parts = x.replace(/\s*[-,]\s*\d{6}\s*$/, '').split(',').map(s=>s.trim()).filter(Boolean);
      return {area:parts[0]||'',district:parts[1]||'',state:'',pincode:pin?pin[0]:''};
    }
    if (typeof x !== 'object' || Array.isArray(x)) return null;
    const a = x.area || x.village || x.city || x.name || '';
    return {area:String(a),city:String(x.city||''),district:String(x.district||''),state:String(x.state||''),pincode:String(x.pincode||''),door:String(x.door||x.house||''),landmark:String(x.landmark||'')};
  }
  function get() {
    try {
      return normalize(parse(localStorage.getItem(KEY))) ||
        normalize(parse(localStorage.getItem(LEGACY))) ||
        normalize(parse(localStorage.getItem('cerood_clothing_selected_location'))) ||
        normalize(parse(localStorage.getItem('cerood_renewed_delivery_location'))) ||
        normalize(parse(localStorage.getItem('cerood_cosmetics_delivery_location'))) ||
        normalize(parse(localStorage.getItem('cerood_clothing_delivery_location'))) ||
        normalize({area:localStorage.getItem('catus_location_name'),district:localStorage.getItem('catus_district_name'),state:localStorage.getItem('catus_state_name'),pincode:localStorage.getItem('catus_pincode')});
    } catch (_) { return null; }
  }
  function label(x) { return x ? [x.area||x.city,x.district,x.pincode].filter(Boolean).join(', ') : ''; }
  function paint() {
    const x=get(), value=label(x);
    if (!value) return;
    for (const id of IDS) {
      const el=document.getElementById(id);
      if (el) { el.textContent=value; el.title=value; }
    }
  }
  function set(input) {
    const x=normalize(input);
    if (!x || !(x.area || x.city || x.pincode)) return false;
    try { localStorage.setItem(KEY,JSON.stringify(x)); }
    catch (_) { return false; }
    paint();
    window.dispatchEvent(new CustomEvent('cerood-global-location-changed',{detail:x}));
    return true;
  }
  window.CeroodLocation={get,set,refresh:paint,label};
  document.addEventListener('DOMContentLoaded',paint);
  window.addEventListener('pageshow',()=>setTimeout(paint,0));
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===LEGACY||e.key?.startsWith('catus_'))paint();});
  for(const ev of ['cerood-location-updated','cerood-renewed-location-changed','cerood-cosmetics-location-changed','cerood-clothing-location-changed'])
    window.addEventListener(ev,()=>setTimeout(paint,0));
  if (document.readyState!=='loading') paint();
})();
