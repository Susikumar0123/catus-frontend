/* Cerood Android mobile-web verification. Native consent opens only after an explicit tap. */
(function(){'use strict';
 if(window.__ceroodTruecallerWeb)return;window.__ceroodTruecallerWeb=true;
 const API='https://catus-backend-d2js.onrender.com';
 if(!/Android/i.test(navigator.userAgent)||!window.isSecureContext)return;
 let config,attempt,timer,preparing=false,running=false,generation=0;
 const modal=document.getElementById('authModal'),input=document.getElementById('inputPhone');
 if(!modal||!input)return;
 const box=document.createElement('div');box.hidden=true;box.style.cssText='margin:14px 0';
 const btn=document.createElement('button');btn.type='button';btn.textContent='Continue with Truecaller';btn.style.cssText='width:100%;padding:12px;border:0;border-radius:10px;background:#0878e8;color:#fff;font:600 14px/1.4 Arial;cursor:pointer';
 const note=document.createElement('p');note.setAttribute('role','status');note.setAttribute('aria-live','polite');note.style.cssText='font-size:12px;line-height:1.5;color:#64748b;margin:8px 0';note.textContent='Share your verified mobile number to sign in. Or continue with mobile number below.';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Use mobile number instead';cancel.hidden=true;cancel.style.cssText='border:0;background:transparent;color:#0878e8;font:600 12px Arial;padding:6px 0;cursor:pointer';
 box.append(btn,note,cancel);input.before(box);
 async function api(path,body){const r=await fetch(API+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(12000)});const d=await r.json();if(!r.ok||!d.success)throw Error(d.message||'Truecaller is unavailable. Use mobile number.');return d;}
 function visible(){return modal.getClientRects().length>0&&getComputedStyle(modal).visibility!=='hidden'&&getComputedStyle(modal).opacity!=='0';}
 function stop(message){generation++;clearTimeout(timer);attempt=null;running=false;preparing=false;btn.disabled=false;btn.textContent='Try Truecaller again';cancel.hidden=true;if(message)note.textContent=message;}
 async function prepare(){if(preparing||running||!config||!visible())return;if(attempt&&Date.now()<attempt.until)return;const g=++generation;preparing=true;btn.disabled=true;btn.textContent='Preparing Truecaller…';try{const a=await api('/api/auth/truecaller/start',{});if(g!==generation)return;attempt={requestId:a.requestId,verifier:a.verifier,until:Date.now()+Math.min(Number(a.expiresIn)||300,300)*1000};btn.disabled=false;btn.textContent='Continue with Truecaller';}catch(e){if(g===generation){btn.disabled=false;btn.textContent='Retry Truecaller setup';note.textContent=e.message;}}finally{if(g===generation)preparing=false;}}
 async function poll(g){if(g!==generation||!running||!attempt)return;if(Date.now()>attempt.until){stop('Verification expired. Use mobile number or try again.');return;}if(document.visibilityState==='hidden'){timer=setTimeout(()=>poll(g),2000);return;}
 try{const d=await api('/api/auth/truecaller/complete',{requestId:attempt.requestId,verifier:attempt.verifier});if(g!==generation)return;
 if(d.status==='verified'){
  if(!d.user||!d.home_service_session)throw Error('Login response incomplete. Use mobile number.');
  const accepted=window.CeroodAcceptTruecallerLogin?.(d);if(!accepted)throw Error('Could not finish login. Use mobile number.');
  stop('Signed in successfully.');return;
 }
 if(d.status==='rejected'){stop('You cancelled Truecaller. Continue with your mobile number.');input.focus();return;}
 }catch(e){if(g!==generation)return;stop(e.message);return;}
 timer=setTimeout(()=>poll(g),2000);
 }
 btn.onclick=function(){if(running)return;if(!attempt||Date.now()>=attempt.until){prepare();return;}
 const p=new URLSearchParams({type:'btmsheet',requestNonce:attempt.requestId,partnerKey:config.appKey,partnerName:'Cerood',lang:'en',privacyUrl:location.origin+'/privacy-policy.html',termsUrl:location.origin+'/terms.html',loginPrefix:'continue',loginSuffix:'loginsignup',ctaPrefix:'continuewith',ctaColor:'#0878e8',ctaTextColor:'#ffffff',btnShape:'round',skipOption:'useanothermethod',ttl:'30000'});
 running=true;btn.disabled=true;btn.textContent='Waiting for Truecaller…';cancel.hidden=false;note.textContent='Approve in Truecaller. If nothing opens, use mobile number instead.';const g=generation;
 // Synchronous navigation inside click: no network await before the app deeplink.
 window.location.href='truecallersdk://truesdk/web_verify?'+p.toString();
 timer=setTimeout(()=>poll(g),2000);
 };
 cancel.onclick=function(){stop('Continue with your mobile number.');input.focus();};
 new MutationObserver(()=>{if(!visible()){if(running||preparing||attempt)stop();}else prepare();}).observe(modal,{attributes:true,attributeFilter:['style','class','hidden']});
 window.addEventListener('pagehide',()=>stop());
 api('/api/auth/truecaller/config').then(d=>{if(!d.enabled||!d.appKey)return;config=d;box.hidden=false;prepare();}).catch(()=>{});
})();
