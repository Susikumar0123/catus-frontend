(function(){'use strict';
 if(window.__ceroodGoogleWeb)return;window.__ceroodGoogleWeb=true;
 const API='https://catus-backend-d2js.onrender.com';
 const input=document.getElementById('inputPhone'),modal=document.getElementById('authModal');if(!input||!modal)return;
 const box=document.createElement('div'),button=document.createElement('div'),note=document.createElement('p'),cancel=document.createElement('button');
 box.style.cssText='margin:14px 0';note.style.cssText='font-size:12px;line-height:1.5;color:#64748b;margin:8px 0';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
 cancel.type='button';cancel.textContent='Cancel Google linking';cancel.hidden=true;cancel.style.cssText='border:0;background:none;color:#0878e8;padding:5px 0';
 box.append(button,note,cancel);input.before(box);
 let config,pending=null,linking=false,refreshing=false;
 async function api(path,body,token){const r=await fetch(API+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok||!d.success)throw Error(d.message||'Google login unavailable. Use mobile login.');return d;}
 function clear(){pending=null;cancel.hidden=true;}
 cancel.onclick=()=>{clear();note.textContent='Continue with mobile login.';};
 async function link(){if(!pending||linking)return;if(Date.now()>pending.until){clear();note.textContent='Google linking expired. Sign in with Google again.';return;}
  const token=localStorage.getItem('cerood_home_service_session');if(!token||token===pending.previousToken)return;
  linking=true;const attempt=pending;clear();try{const d=await api('/api/home-services/auth/google/link',attempt.body,token);note.textContent=d.message;if(typeof showToast==='function')showToast(d.message,false);}catch(e){note.textContent=e.message;if(typeof showToast==='function')showToast(e.message,true);}finally{linking=false;}
 }
 async function accept(response){clear();note.textContent='Checking Google login…';try{
  const body={credential:response.credential,challenge:config.challenge};const d=await api('/api/home-services/auth/google/login',body);
  if(d.requires_phone_login){pending={body,previousToken:localStorage.getItem('cerood_home_service_session'),until:Date.now()+9*60000};cancel.hidden=false;note.textContent='First time only: sign in or verify your mobile below to link this Google account. Next time, use Google directly.';input.focus();return;}
  if(!window.CeroodAcceptTruecallerLogin?.(d))throw Error('Could not finish login. Use mobile login.');note.textContent='Signed in with Google.';
 }catch(e){note.textContent=e.message;}}
 new MutationObserver(()=>{link();if(config && !pending && Date.now()>config.refreshAt && modal.getClientRects().length)refresh();}).observe(modal,{attributes:true,attributeFilter:['class','style','hidden']});window.addEventListener('cerood:auth-changed',link);
 window.addEventListener('pagehide',clear);
 function render(){google.accounts.id.initialize({client_id:config.clientId,nonce:config.nonce,callback:accept,auto_select:false});button.replaceChildren();google.accounts.id.renderButton(button,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'rectangular',width:280});}
 async function refresh(){if(refreshing)return;refreshing=true;try{const d=await api('/api/home-services/auth/google/config');if(!d.enabled)throw Error('Google unavailable');config={...d,refreshAt:Date.now()+8*60000};render();}catch(_){note.textContent='Google refresh failed. Use mobile login or reload.';}finally{refreshing=false;}}
 setInterval(()=>{if(config&&!pending&&Date.now()>config.refreshAt&&modal.getClientRects().length)refresh();},60000);
 api('/api/home-services/auth/google/config').then(d=>{if(!d.enabled){box.hidden=true;return;}config={...d,refreshAt:Date.now()+8*60000};note.textContent='First use links Google to your mobile account. By continuing, you agree to this link.';
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=render;script.onerror=()=>{note.textContent='Google could not load. Continue with mobile login.';};document.head.append(script);
 }).catch(()=>{box.hidden=true;});
})();
