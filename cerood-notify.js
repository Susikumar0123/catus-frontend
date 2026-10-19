/* Guest Web Push. Notification permission is consent, not customer login. */
(function () {
 'use strict';
 if (window.CeroodNotify?.version === 'guest-push-1') return;
 const API = 'https://catus-backend-d2js.onrender.com';
 const KEY = 'cerood_push_manage_v1';
 const OPT_OUT = 'cerood_push_opt_out_v1';
 let optedOut=false;
 function isOptedOut(){try{return optedOut||localStorage.getItem(OPT_OUT)==='1';}catch(_){return optedOut;}}
 const WORKER = '/cerood-push-worker.js?v=guest1';
 const SCOPE = '/cerood-push/';
 let pending, memory, last = {state:'idle'};
 const supported = () => window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
 function saved() {try{return JSON.parse(localStorage.getItem(KEY)||'null')||memory;}catch(_){return memory;}}
 function remember(value) {memory=value;try {if(value)localStorage.setItem(KEY,JSON.stringify(value));else localStorage.removeItem(KEY);}catch(_) {}}
 function report(state,message) {last={state,message:message||''};window.dispatchEvent(new CustomEvent('cerood:push-state',{detail:last}));}
 async function request(path,body) {
  const r=await fetch(API+path,{method:body?'POST':'GET',cache:'no-store',credentials:'omit',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  const d=await r.json();if(!r.ok||!d.success)throw Error(d.message||'Unable to save notification subscription.');return d;
 }
 function decode(s) {const text=s.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(text+'='.repeat((4-text.length%4)%4)),c=>c.charCodeAt(0));}
 function activate(reg) {
  const worker=reg.installing||reg.waiting||reg.active;
  if(worker?.state==='activated')return Promise.resolve(reg);
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(Error('Notification worker activation timed out. Please retry.')),20000);
   function finish(error){clearTimeout(timer);worker?.removeEventListener('statechange',check);error?reject(error):resolve(reg);}
   function check(){if(worker?.state==='activated')finish();else if(worker?.state==='redundant')finish(Error('Notification worker failed to activate.'));}
   if(!worker){finish(Error('Notification worker is unavailable.'));return;}
   worker.addEventListener('statechange',check);check();
  });
 }
 async function connect(division) {
  const config=await request('/api/notify/config');
  if(!config.enabled||!config.publicKey)throw Error('Notifications are not configured on the server.');
  const reg=await activate(await navigator.serviceWorker.register(WORKER,{scope:SCOPE,updateViaCache:'none'}));
  // Use THIS registration, never navigator.serviceWorker.ready (the Home PWA has a different scope).
  const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(config.publicKey)});
  const previous=saved();
  const data=await request('/api/notify/subscribe',{subscription:sub.toJSON(),division});
  if(typeof data.manageToken!=='string'||data.manageToken.length<32)throw Error('Notification server response is incomplete.');
  remember({endpoint:sub.endpoint,manageToken:data.manageToken,division,scope:SCOPE});
  if(previous?.endpoint && previous.manageToken && previous.endpoint!==sub.endpoint){
   try {await request('/api/notify/unsubscribe',{endpoint:previous.endpoint,manageToken:previous.manageToken});}
   catch(_){/* New subscription is saved; do not break it if old cleanup fails. */}
  }
  optedOut=false;try{localStorage.removeItem(OPT_OUT);}catch(_){}
  report('subscribed','Cerood updates enabled on this browser.');return true;
 }
 async function enable(division='services') {
  if(!supported())throw Error('Push notifications are unavailable in this browser.');
  if(pending)return pending;
  // Request permission before any network await to preserve a button tap's activation.
  const permission=Notification.permission==='default'?Notification.requestPermission():Promise.resolve(Notification.permission);
  pending=(async()=>{const result=await permission;if(result!=='granted'){report(result==='denied'?'blocked':'dismissed');throw Error('Notifications were not enabled.');}report('connecting');return connect(division);})().catch(e=>{report(Notification.permission==='denied'?'blocked':'error',e.message);throw e;}).finally(()=>{pending=null;});
  return pending;
 }
 async function sync(division='services') {
  if(!supported()||isOptedOut()||Notification.permission!=='granted')return false;
  return enable(division);
 }
 async function disable() {
  const value=saved();
  // Deactivate stored endpoint first, so a server error remains retryable.
  if(value?.endpoint&&value.manageToken)await request('/api/notify/unsubscribe',{endpoint:value.endpoint,manageToken:value.manageToken});
  const reg=await navigator.serviceWorker.getRegistration(SCOPE);
  if(reg&&new URL(reg.scope).pathname===SCOPE){const sub=await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe();}
  remember(null);optedOut=true;try{localStorage.setItem(OPT_OUT,'1');}catch(_){}report('disabled');return true;
 }
 async function status() {
  if(!supported())return {supported:false,state:'unsupported'};
  const reg=await navigator.serviceWorker.getRegistration(SCOPE);
  const sub=reg&&new URL(reg.scope).pathname===SCOPE?await reg.pushManager.getSubscription():null;
  const value=saved();
  return {...last,supported:true,permission:Notification.permission,subscribed:!!sub,savedOnThisBrowser:!!(sub&&value?.endpoint===sub.endpoint&&value?.manageToken),scope:reg?.scope||null};
 }
 async function start(division='services') {
  if(!supported()||isOptedOut())return false;
  if(Notification.permission==='denied'){if(saved())try{await disable();}catch(_){}return false;}
  if(Notification.permission==='default'){
   try{if(sessionStorage.getItem('cerood_native_notify_requested_guest1'))return false;sessionStorage.setItem('cerood_native_notify_requested_guest1','1');}catch(_){}
   // Existing native prompt behavior retained. Browsers can suppress page-load prompts.
  }
  try{return await enable(division);}catch(e){console.debug('Cerood push:',e.message);return false;}
 }
 window.CeroodNotify={version:'guest-push-1',enable,sync,disable,status,start};
 // Recover if permission is changed to Allow via browser settings while the page is open.
 try{navigator.permissions?.query({name:'notifications'}).then(p=>{p.onchange=()=>{if(p.state==='granted')sync().catch(()=>{});else if(p.state==='denied')disable().catch(()=>{});};}).catch(()=>{});}catch(_){}
})();
