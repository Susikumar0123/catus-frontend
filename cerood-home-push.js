(function(){'use strict';
 const API='https://catus-backend-d2js.onrender.com',manageKey='cerood_push_manage_v1';
 let busy=false;
 const token=()=>localStorage.getItem('cerood_home_service_session')||'';
 async function request(path,body,auth=true){const session=token(),r=await fetch(API+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:'Bearer '+session}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});const data=await r.json();if(auth&&session!==token())throw Error('Account changed. Open notifications again.');if(!r.ok||!data.success)throw Error(data.message||'Notification request failed.');return data;}
 const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 async function enable(){
  if(!token())throw Error('Sign in to Home Services first.');
  if(!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window))throw Error('This browser does not support push notifications. Your updates are still available in the inbox.');
  if(Notification.permission==='denied')throw Error('Notifications are blocked. Allow notifications in your browser site settings, then try again.');
  // Permission is requested only from the customer's explicit button click.
  const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Notifications were not allowed. You can still read the inbox.');
  const config=await request('/api/notify/config',null,false);if(!config.enabled)throw Error('Browser push is not configured yet. You can still read your inbox.');
  await navigator.serviceWorker.register('/service-worker.js',{scope:'/'});const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(config.publicKey)});
  const saved=await request('/api/notify/subscribe',{subscription:sub.toJSON(),division:'services'},false);
  const proof={endpoint:sub.endpoint,manageToken:saved.manageToken};localStorage.setItem(manageKey,JSON.stringify(proof));
  await request('/api/home-services/customer/push-link',proof);return 'This browser is connected to your Home Service account. Push display depends on browser/device settings.';
 }
 async function disconnect(){
  let saved;try{saved=JSON.parse(localStorage.getItem(manageKey)||'null');}catch{}
  if(saved?.endpoint&&saved?.manageToken){try{await request('/api/notify/home-unlink',saved,false);}catch(error){const registration=await navigator.serviceWorker?.getRegistration('/service-worker.js');const sub=await registration?.pushManager?.getSubscription();if(sub){await sub.unsubscribe();localStorage.removeItem(manageKey);}else if(!navigator.onLine)throw error;}}
  const reg=await navigator.serviceWorker?.getRegistration('/service-worker.js');
  const notifications=await reg?.getNotifications?.();for(const n of notifications||[])if(String(n.tag).startsWith('cerood-home-'))n.close();
 }
 async function inbox(){const result=await request('/api/home-services/customer/notifications');const list=document.getElementById('ceroodHomeInbox');if(!list)return;list.replaceChildren();for(const n of result.notifications){const item=document.createElement('div');item.style.cssText='padding:12px 0;border-top:1px solid #e5e7eb';const title=document.createElement('strong'),body=document.createElement('p'),date=document.createElement('small');title.textContent=n.title;body.textContent=n.body;date.textContent=new Date(n.created_at).toLocaleString('en-IN');item.append(title,body,date);list.append(item);}if(!result.notifications.length)list.textContent='No booking notifications yet.';}
 function mount(){const host=document.getElementById('dashTabBookings');if(!host||document.getElementById('ceroodHomePushCard'))return;const card=document.createElement('section');card.id='ceroodHomePushCard';card.className='prem-card-box';card.style.cssText='padding:16px;margin:12px 0';card.innerHTML='<strong>Booking notifications</strong><p style="font-size:12px;color:#64748b">Get personal booking updates on this browser. Notifications may appear on your lock screen.</p><button type="button" class="prem-btn-small" id="ceroodEnableHomePush">Enable on this browser</button> <button type="button" class="prem-btn-small" id="ceroodDisableHomePush">Disconnect personal alerts</button> <button type="button" class="prem-btn-small" id="ceroodViewHomeInbox">View my notifications</button><p role="status" id="ceroodHomePushStatus"></p><div id="ceroodHomeInbox"></div>';host.prepend(card);
  const status=card.querySelector('[role=status]');
  async function action(fn){if(busy)return;busy=true;card.querySelectorAll('button').forEach(b=>b.disabled=true);try{status.textContent=await fn()||'';}catch(e){status.textContent=e.message;}finally{busy=false;card.querySelectorAll('button').forEach(b=>b.disabled=false);}}
  card.querySelector('#ceroodEnableHomePush').onclick=()=>action(enable);
  card.querySelector('#ceroodDisableHomePush').onclick=()=>action(async()=>{await disconnect();return 'Personal booking alerts disconnected on this browser.';});
  card.querySelector('#ceroodViewHomeInbox').onclick=()=>action(async()=>{await inbox();return 'Your latest notifications are shown below.';});
 }
 window.CeroodHomePush={disconnect};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
 window.addEventListener('storage',e=>{if(['cerood_home_service_session','cerood_home_service_user'].includes(e.key)){document.getElementById('ceroodHomeInbox')?.replaceChildren();const message=document.getElementById('ceroodHomePushStatus');if(message)message.textContent='Account changed. Enable this browser for personal alerts if needed.';}});
})();
