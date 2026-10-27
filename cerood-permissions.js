/* Optional browser capabilities. No automatic contact/media upload. */
(function(){'use strict';
 if(document.getElementById('ceroodPermissions'))return;
 const dialog=document.createElement('dialog');dialog.id='ceroodPermissions';dialog.setAttribute('aria-labelledby','ceroodPermissionTitle');
 dialog.innerHTML='<div class="cp-head"><h2 id="ceroodPermissionTitle">Make Cerood work for you</h2><button type="button" data-close aria-label="Close permissions">×</button></div><p>Choose what you want to enable. Everything here is optional.</p><div class="cp-list"></div><button type="button" class="cp-later" data-close>Continue without enabling</button>';
 const list=dialog.querySelector('.cp-list');
 function row(title,description,label,action){const box=document.createElement('section'),heading=document.createElement('h3'),copy=document.createElement('p'),button=document.createElement('button'),status=document.createElement('p');heading.textContent=title;copy.textContent=description;button.type='button';button.textContent=label;status.className='cp-status';status.setAttribute('role','status');box.append(heading,copy,button,status);list.append(box);button.addEventListener('click',async()=>{if(button.disabled)return;button.disabled=true;try{await action(status,button);}catch(e){status.textContent=e?.name==='AbortError'?'Selection cancelled.':'Could not complete this. Please try again.';}finally{button.disabled=false;}});return {button,status};}
 const notification=row('Notifications','Allow booking and service updates.','Enable',async(status)=>{
  if(!window.isSecureContext||!('Notification'in window)){status.textContent='Notifications are unavailable in this browser. On iPhone, try adding Cerood to your Home Screen first.';return;}
  if(Notification.permission==='denied'){status.textContent='Notifications are blocked. You can change this in your browser’s site settings.';return;}
  const permission=await Notification.requestPermission();status.textContent=permission==='granted'?'Browser permission enabled. Sign in to link booking updates through Cerood’s existing notification system.': 'Notifications were not enabled. You can continue using Cerood.';
 });
 if('Notification'in window&&Notification.permission==='granted'){notification.button.textContent='Check status';notification.status.textContent='Browser permission is already enabled.';}
 row('Contacts','Select contacts on supported browsers. Nothing is uploaded or saved.','Choose contacts',async(status)=>{
  if(!navigator.contacts?.select||!window.isSecureContext){status.textContent='Contact selection is not supported in this browser. No contacts were accessed.';return;}
  const contacts=await navigator.contacts.select(['name','tel'],{multiple:true});status.textContent=contacts.length+' contact(s) selected for this preview. Contacts are not stored or uploaded; friend matching is not connected yet.';
 });
 const media=row('Photos and videos','Choose specific files for a local preview. Reels publishing is not connected yet.','Choose files',async()=>picker.click());
 const picker=document.createElement('input');picker.type='file';picker.accept='image/*,video/*';picker.multiple=true;picker.hidden=true;dialog.append(picker);
 const preview=document.createElement('div');preview.className='cp-preview';media.status.after(preview);let urls=[];
 function clearMedia(){urls.forEach(URL.revokeObjectURL);urls=[];preview.replaceChildren();picker.value='';}
 picker.addEventListener('change',()=>{urls.forEach(URL.revokeObjectURL);urls=[];preview.replaceChildren();const files=Array.from(picker.files||[]);for(const file of files.slice(0,4)){if(!/^(image|video)\//.test(file.type))continue;const url=URL.createObjectURL(file);urls.push(url);const el=document.createElement(file.type.startsWith('image/')?'img':'video');el.src=url;if(el.tagName==='IMG')el.alt=file.name;else{el.controls=true;el.preload='metadata';el.playsInline=true;}preview.append(el);}media.status.textContent=files.length+' file(s) selected. Local preview only; nothing uploaded.';});
 row('Mobile number','Verify your number using Cerood’s existing OTP login. Websites cannot request Android Phone access.','Open login',async(status)=>{if(typeof window.toggleAuthModal!=='function'){status.textContent='Please use the existing Login option on this page.';return;}dialog.close();window.toggleAuthModal(true);});
 document.body.append(dialog);
 function remember(){try{sessionStorage.setItem('cerood_optional_permissions_seen','1');}catch{}}
 dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));dialog.addEventListener('close',()=>{remember();clearMedia();});dialog.addEventListener('cancel',remember);
 const opener=document.createElement('button');opener.type='button';opener.id='ceroodPermissionsOpen';opener.textContent='Privacy & permissions';opener.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();});document.body.append(opener);
 window.CeroodPermissions={open:()=>{if(!dialog.open)dialog.showModal();}};
 // Explain choices once per tab, without automatically requesting any permission.
 setTimeout(()=>{let seen=false;try{seen=sessionStorage.getItem('cerood_optional_permissions_seen')==='1';}catch{}const blockers=['#authModal','#locationPopupModal','#ceroodManualAddressModal','.modal-overlay'];const busy=document.querySelector('dialog[open]')||blockers.some(s=>{const el=document.querySelector(s);return el&&getComputedStyle(el).display!=='none'&&el.getClientRects().length;});if(!seen&&!busy&&!document.hidden)dialog.showModal();},1800);
})();
