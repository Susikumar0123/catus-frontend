/* Cerood Home Services conversion Phase 1 — additive, no checkout replacement. */
(function () {
  'use strict';
  if (window.__ceroodHomeConversionV1) return;
  window.__ceroodHomeConversionV1 = true;
  var STORE_KEY = 'cerood_home_conversion_first_touch_v1';
  var API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://catus-backend-d2js.onrender.com';
  function clean(v, max) { return String(v || '').trim().slice(0,max); }
  function path(p) { return /^\/(?!\/)/.test(p || '') ? clean(String(p).split(/[?#]/)[0], 240) : '/'; }
  function host(ref) { try { return new URL(ref).hostname.slice(0, 120); } catch (_) { return ''; } }
  function generateVisit() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + '-' + String(Math.floor(Math.random() * 1e9));
  }
  function firstTouch() {
    try {
      var stored = sessionStorage.getItem(STORE_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.visit_id) return parsed;
      }
    } catch (_) { /* Storage optional. */ }
    var q = new URLSearchParams(location.search);
    var data = {
      visit_id: generateVisit(), landing_path: path(location.pathname),
      utm_source: clean(q.get('utm_source'),64), utm_medium:clean(q.get('utm_medium'),64),
      utm_campaign:clean(q.get('utm_campaign'),100), referrer_host: host(document.referrer)
    };
    try { sessionStorage.setItem(STORE_KEY,JSON.stringify(data)); } catch (_) {}
    return data;
  }
  function context() { return Object.assign({}, firstTouch(), { page_path: path(location.pathname) }); }
  function track(type) {
    var body = JSON.stringify({ event_type:type, conversion:context() });
    try {
      if (window.gtag) {
        var eventMap = {call_click:'click_to_call',browse_services:'select_content',checkout_view:'begin_checkout',booking_attempt:'booking_request_attempt'};
        window.gtag('event',eventMap[type]||type, {event_category:'home_services'});
      }
      var url = API + '/api/home-services/conversion-event';
      if (navigator.sendBeacon && navigator.sendBeacon(url,new Blob([body],{type:'application/json'}))) return;
      fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true,mode:'cors'}).catch(function(){});
    } catch (_) { /* Analytics should never block customers. */ }
  }
  window.CeroodHomeConversion = { context:context, track:track };
  function init() {
    // Capture existing call links, including the current mobile header Call Now.
    document.addEventListener('click',function(e){
      var a = e.target && e.target.closest && e.target.closest('a[href^="tel:"]');
      if (a) track('call_click');
    },true);
    if (/\/?checkout\.html$/i.test(location.pathname)) {
      track('checkout_view');
      return;
    }
    var grid = document.getElementById('productGridContainer');
    if (!grid || document.getElementById('ceroodHSConversionPanel')) return;
    var panel = document.createElement('section');
    panel.id = 'ceroodHSConversionPanel';
    panel.setAttribute('aria-label','Book a home service');
    panel.innerHTML = '<div class="chs-conv-copy"><strong>Need appliance service?</strong><span>Choose a service or call Cerood. Booking request is ₹0; any inspection/visiting fee will be confirmed before the visit.</span></div><div class="chs-conv-buttons"><a href="tel:+918946055856" class="chs-conv-call">Call Cerood</a><button type="button" class="chs-conv-browse">Choose a service</button></div>';
    var css = document.createElement('style');
    css.id = 'ceroodHSConversionStyles';
    css.textContent = '#ceroodHSConversionPanel{box-sizing:border-box;margin:14px 15px 18px;padding:18px 20px;border:1px solid #dbe8e3;border-radius:14px;background:#f5faf7;color:#102b24;display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:Inter,Arial,sans-serif}.chs-conv-copy{display:flex;flex-direction:column;gap:6px;max-width:660px}.chs-conv-copy strong{font-size:20px;line-height:1.2}.chs-conv-copy span{font-size:13px;line-height:1.5;color:#50645e}.chs-conv-buttons{display:flex;gap:10px;flex-shrink:0}.chs-conv-buttons a,.chs-conv-buttons button{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer;border:1px solid #12694f;min-height:44px}.chs-conv-call{background:#fff;color:#12694f}.chs-conv-browse{background:#12694f;color:#fff}@media(max-width:850px){#ceroodHSConversionPanel{margin:12px;padding:14px;display:block}.chs-conv-copy strong{font-size:18px}.chs-conv-copy span{font-size:12px}.chs-conv-buttons{margin-top:12px;display:grid;grid-template-columns:1fr 1fr}.chs-conv-buttons a,.chs-conv-buttons button{padding:12px 8px;font-size:12px}}';
    document.head.appendChild(css);
    var before = document.querySelector('.cerood-festival-banner') || grid;
    before.parentNode.insertBefore(panel,before);
    panel.querySelector('.chs-conv-browse').addEventListener('click',function(){
      track('browse_services');
      grid.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
