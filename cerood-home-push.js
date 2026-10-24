/* Link existing notification consent to the authenticated Home account.
   No dashboard box and no extra permission prompt. */
(function(){'use strict';
 const API='https://catus-backend-d2js.onrender.com',manageKey='cerood_push_manage_v1';
 let running=false,lastSession='',lastLinked=0,nextAttempt=0,suppressed='';
 const session=()=>localStorage.getItem('cerood_home_service_session')||'';
 const supported=()=>('Notification'in window)&&('serviceWorker'in navigator)&&('PushManager'in window);
 const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 async function request(path,body,authSession){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const r=await fetch(API+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(authSession?{Authorization:'Bearer '+authSession}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal,cache:'no-store'});const data=await r.json();if(!r.ok||!data.success){const e=Error(data.message||'Notification connection failed.');e.status=r.status;throw e;}return data;}finally{clearTimeout(timer);}
 }
 function savedProof(){try{return JSON.parse(localStorage.getItem(manageKey)||'null');}catch{return null;}}
 async function sync(){
  document.getElementById('ceroodHomePushCard')?.remove();
  const current=session(),now=Date.now();
  if(!current||current===suppressed||running||!supported()||Notification.permission!=='granted'||document.hidden)return;
  if(current===lastSession&&now-lastLinked<300000||now<nextAttempt&&current===lastSession)return;
  running=true;lastSession=current;nextAttempt=now+60000;
  try{
   // Consent is already granted. Reuse the site's existing service worker.
   let reg=await navigator.serviceWorker.getRegistration('/service-worker.js');
   if(!reg)reg=await navigator.serviceWorker.register('/service-worker.js',{scope:'/'});
   if(!reg.active)reg=await navigator.serviceWorker.ready;
   if(session()!==current||current===suppressed)return;
   let sub=await reg.pushManager.getSubscription();
   let config;
   if(!sub){config=await request('/api/notify/config');if(!config.enabled)return;sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(config.publicKey)});}
   if(session()!==current||current===suppressed)return;
   let proof=savedProof();
   // A previous opt-in usually already holds a valid management token.
   if(proof?.endpoint===sub.endpoint&&proof.manageToken){
    try{await request('/api/home-services/customer/push-link',proof,current);if(session()===current&&current!==suppressed)lastLinked=Date.now();return;}
    catch(e){if(e.status!==403)throw e;}
   }
   if(session()!==current||current===suppressed)return;
   const result=await request('/api/notify/subscribe',{subscription:sub.toJSON(),division:'services'});
   proof={endpoint:sub.endpoint,manageToken:result.manageToken};localStorage.setItem(manageKey,JSON.stringify(proof));
   if(session()!==current||current===suppressed)return;
   await request('/api/home-services/customer/push-link',proof,current);
   if(session()===current&&current!==suppressed)lastLinked=Date.now();
  }catch(e){console.warn('Cerood personal notification connection unavailable; retrying later.');}
  finally{running=false;}
 }
 async function disconnect(){
  suppressed=session();lastLinked=0;
  // Let any current link finish before removing it so logout cannot race a relink.
  if(running){for(let i=0;i<100&&running;i++)await new Promise(resolve=>setTimeout(resolve,100));if(running)throw Error('Notification connection is busy. Retry logout.');}
  const proof=savedProof();
  if(proof?.endpoint&&proof.manageToken){try{await request('/api/notify/home-unlink',proof);}catch(e){const r=await navigator.serviceWorker?.getRegistration('/service-worker.js');const sub=await r?.pushManager?.getSubscription();if(sub){await sub.unsubscribe();localStorage.removeItem(manageKey);}else if(!navigator.onLine)throw e;}}
  const reg=await navigator.serviceWorker?.getRegistration('/service-worker.js');for(const n of await reg?.getNotifications?.()||[])if(String(n.tag).startsWith('cerood-home-'))n.close();
 }
 window.CeroodHomePush={disconnect};
 const resume=()=>{if(session()!==lastSession){lastLinked=0;nextAttempt=0;}sync();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resume);else resume();
 window.addEventListener('storage',e=>{if(['cerood_home_service_session','cerood_home_service_user','cerood_push_manage_v1'].includes(e.key))resume();});
 window.addEventListener('focus',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);
 // Detect same-tab login and a permission granted through the existing site prompt.
 setInterval(resume,5000);
})();
