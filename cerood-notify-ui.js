/* Cerood Notify — opt-in UI. Never calls browser permission without customer click. */
(function () {
 'use strict';
 if (window.__ceroodNotifyUI) return;
 window.__ceroodNotifyUI = true;
 const division = document.currentScript?.dataset.division || 'all';
 const STORAGE = 'cerood_notify_ui_dismiss_until_v1';
 const style = document.createElement('style');
 style.id = 'cerood-notify-ui-style';
 style.textContent = `
 #cn-bell{position:fixed;right:17px;bottom:88px;z-index:1100;width:46px;height:46px;border:1px solid #e7ddff;border-radius:50%;background:#fff;color:#5738d9;box-shadow:0 7px 24px #24175c24;display:grid;place-items:center;cursor:pointer;transition:transform .2s,box-shadow .2s}
 #cn-bell:hover{transform:translateY(-2px);box-shadow:0 10px 28px #24175c30}#cn-bell svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}#cn-bell.cn-on:after{content:'';position:absolute;top:8px;right:8px;width:8px;height:8px;background:#1ab77a;border:2px solid white;border-radius:50%}
 #cn-card{position:fixed;right:17px;bottom:146px;z-index:1101;width:min(365px,calc(100vw - 32px));box-sizing:border-box;background:#fff;border:1px solid #e8e2f5;border-radius:20px;box-shadow:0 18px 65px #21154b2d;padding:19px;color:#25213c;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:left}#cn-card[hidden],#cn-bell[hidden]{display:none!important}#cn-card *{box-sizing:border-box}#cn-card .cn-head{display:flex;gap:12px;align-items:center}#cn-card .cn-mark{width:44px;height:44px;flex:0 0 44px;border-radius:14px;background:linear-gradient(140deg,#334a8a,#6740db 65%,#e02c9d);color:#fff;display:grid;place-items:center;font-size:21px;font-weight:800}#cn-card .cn-brand{font-size:11px;letter-spacing:.09em;color:#6850b5;font-weight:800}#cn-card h2{font-size:18px;line-height:1.25;letter-spacing:-.35px;margin:3px 0 0;font-weight:800;color:#25213c}#cn-card .cn-close{margin-left:auto;align-self:flex-start;background:#f5f2fb;border:0;border-radius:50%;width:30px;height:30px;cursor:pointer;color:#655c78;font-size:21px;line-height:1}#cn-card p{font-size:12.5px;line-height:1.65;color:#6c657d;margin:13px 0}#cn-card .cn-perks{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px}#cn-card .cn-perks span{font-size:10px;color:#5545a0;background:#f5f1ff;border-radius:30px;padding:6px 9px;font-weight:700}#cn-card .cn-actions{display:flex;gap:9px}#cn-card button.cn-enable{flex:1;min-height:43px;border:0;border-radius:11px;background:linear-gradient(110deg,#4d3cbd,#7545e5);color:#fff;font-size:12px;font-weight:800;cursor:pointer;padding:10px}#cn-card button.cn-later{min-height:43px;border:1px solid #e9e4f3;border-radius:11px;background:#fff;color:#696179;font-size:12px;font-weight:700;cursor:pointer;padding:10px 14px}#cn-card button:disabled{opacity:.65;cursor:wait}#cn-card .cn-status{font-size:11px;line-height:1.5;margin:10px 0 0;color:#9b3745}#cn-card .cn-status:empty{display:none}#cn-card .cn-foot{font-size:10px;color:#928b9e;margin-top:12px}#cn-card button:focus-visible,#cn-bell:focus-visible{outline:3px solid #ad96ff;outline-offset:3px}
 @media(max-width:600px){#cn-bell{right:13px;bottom:calc(78px + env(safe-area-inset-bottom,0px));width:43px;height:43px}#cn-card{right:12px;bottom:calc(132px + env(safe-area-inset-bottom,0px));width:calc(100vw - 24px);padding:16px;border-radius:17px}}
 @media(prefers-reduced-motion:reduce){#cn-bell{transition:none}}
 `;
 document.head.appendChild(style);
 function icon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>'}
 const bell=document.createElement('button');bell.id='cn-bell';bell.type='button';bell.setAttribute('aria-label','Cerood notification preferences');bell.setAttribute('title','Cerood notifications');bell.innerHTML=icon();
 const card=document.createElement('section');card.id='cn-card';card.hidden=true;card.setAttribute('role','dialog');card.setAttribute('aria-label','Cerood notification preferences');
 card.innerHTML='<div class="cn-head"><div class="cn-mark" aria-hidden="true">C</div><div><div class="cn-brand">CEROOD UPDATES</div><h2>Stay close to what matters ✨</h2></div><button type="button" class="cn-close" aria-label="Close notification preferences">×</button></div><p>Booking updates, new arrivals and thoughtful offers from Cerood — delivered to your device only when you choose.</p><div class="cn-perks"><span>✓ Booking updates</span><span>✦ Exclusive offers</span><span>♡ New arrivals</span></div><div class="cn-actions"><button type="button" class="cn-enable">Enable notifications</button><button type="button" class="cn-later">Not now</button></div><p class="cn-status" role="status" aria-live="polite"></p><div class="cn-foot">Your choice, always. You can turn notifications off in browser settings.</div>';
 document.body.append(bell,card);
 const enable=card.querySelector('.cn-enable'),status=card.querySelector('.cn-status');
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const standalone=window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone===true;
 const supported='serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
 function show(){card.hidden=false;bell.setAttribute('aria-expanded','true');}
 function hide(){card.hidden=true;bell.setAttribute('aria-expanded','false');}
 function dismiss(){try{localStorage.setItem(STORAGE,String(Date.now()+7*86400000))}catch{}hide()}
 bell.addEventListener('click',()=>card.hidden?show():hide());
 card.querySelector('.cn-close').addEventListener('click',dismiss);
 card.querySelector('.cn-later').addEventListener('click',dismiss);
 function state(){if(!supported){enable.textContent='Notifications unavailable';enable.disabled=true;status.textContent='This browser does not support web push notifications.';return}if(ios&&!standalone){enable.textContent='How to enable on iPhone';status.textContent='On iPhone: Share → Add to Home Screen. Open Cerood from Home Screen, then enable notifications.';return}if(Notification.permission==='denied'){enable.textContent='Blocked in browser';enable.disabled=true;status.textContent='To enable, change notification permission for cerood.com in your browser settings.';return}if(Notification.permission==='granted'){enable.textContent='Enable Cerood updates';status.textContent='Notifications are allowed. Tap to finish or refresh your Cerood subscription.';}}
 state();
 enable.addEventListener('click',async()=>{
  if(ios&&!standalone){status.textContent='Tap Share → Add to Home Screen, then open Cerood from the Home Screen and tap this bell again.';return}
  if(!window.CeroodNotify?.enable){status.textContent='Notification service is still loading. Please refresh and try again.';return}
  enable.disabled=true;enable.textContent='Connecting…';status.textContent='';
  try{await window.CeroodNotify.enable(division);bell.classList.add('cn-on');enable.textContent='Notifications enabled ✓';status.style.color='#188558';status.textContent='You are subscribed to Cerood updates. Thank you!';try{localStorage.setItem(STORAGE,String(Date.now()+30*86400000))}catch{}setTimeout(hide,2200)}
  catch(e){status.style.color='#9b3745';status.textContent=e?.message||'Could not enable notifications. Please try again.';enable.disabled=false;enable.textContent='Try again';}
 });
 if(supported&&Notification.permission==='granted'){
  navigator.serviceWorker.getRegistration('/service-worker.js').then(r=>r?.pushManager?.getSubscription()).then(s=>{if(s)bell.classList.add('cn-on')}).catch(()=>{});
 }
 try{const until=Number(localStorage.getItem(STORAGE)||0);if(!sessionStorage.getItem('cerood_notify_ui_shown_v1')&&Date.now()>until&&supported&&Notification.permission==='default'&&(!ios||standalone)){
  sessionStorage.setItem('cerood_notify_ui_shown_v1','1');setTimeout(()=>{if(document.visibilityState==='visible'&&card.hidden)show()},6000)
 }}catch{}
})();
