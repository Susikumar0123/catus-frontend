/* Native browser permission/picker entry points; no custom permission dialog. */
(function(){'use strict';
 document.getElementById('ceroodPermissions')?.remove();
 document.getElementById('ceroodPermissionsOpen')?.remove();
 async function notifications(){
  if(!window.isSecureContext||!('Notification'in window))return 'unsupported';
  if(Notification.permission!=='default')return Notification.permission;
  return Notification.requestPermission();
 }
 window.CeroodPermissions={
  notifications,
  contacts:async()=>{
   if(!window.isSecureContext||!navigator.contacts?.select)throw new Error('Contact picker is not supported in this browser.');
   return navigator.contacts.select(['name','tel'],{multiple:true});
  },
  chooseMedia:()=>{
   const input=document.createElement('input');input.type='file';input.accept='image/*,video/*';input.multiple=true;
   input.hidden=true;document.body.append(input);
   return new Promise(resolve=>{const finish=files=>{input.remove();resolve(files);};input.addEventListener('change',()=>finish(Array.from(input.files||[])),{once:true});input.addEventListener('cancel',()=>finish([]),{once:true});input.click();});
  }
 };
 // A deliberate tap is required; never attach permission requests to unrelated page clicks.
 if(!window.isSecureContext||!('Notification'in window)||Notification.permission!=='default')return;
 const button=document.createElement('button');button.id='ceroodNativeNotify';button.type='button';button.textContent='Enable notifications';
 Object.assign(button.style,{position:'fixed',left:'8px',bottom:'calc(80px + env(safe-area-inset-bottom, 0px))',zIndex:'1100',border:'1px solid #dbe2ed',borderRadius:'20px',padding:'10px 14px',background:'#fff',color:'#2454ff',font:'600 12px system-ui,sans-serif',cursor:'pointer'});
 button.addEventListener('click',async()=>{button.disabled=true;try{const permission=await notifications();if(permission==='granted'||permission==='denied')button.remove();}catch{}finally{button.disabled=false;}});
 document.body.append(button);
})();
