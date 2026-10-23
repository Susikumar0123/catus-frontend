// Cerood Local Discovery — MSG91 Web SDK default popup (does not touch Home Service).
(() => {
  'use strict';
  const ENDPOINT='/api/local/auth';
  const conf=window.CeroodLocalMsg91Config;
  const header={'content-type':'application/json','x-cerood-local-client':'web'};
  let scriptLoading;
  async function api(path, body) {
    const resp=await fetch(ENDPOINT+path, {
      method: body===undefined ? 'GET' : 'POST',
      credentials:'same-origin',headers:header,
      ...(body===undefined ? {} : {body:JSON.stringify(body)})
    });
    const data=await resp.json().catch(()=>({}));
    if(!resp.ok) throw new Error(data.error || 'Login failed. Try again.');
    return data;
  }
  function loadWidget() {
    if(scriptLoading) return scriptLoading;
    scriptLoading=new Promise((resolve,reject)=>{
      const urls=['https://verify.msg91.com/otp-provider.js', 'https://verify.phone91.com/otp-provider.js'];
      let index=0;
      function attempt() {
        const s=document.createElement('script');
        s.src=urls[index]; s.async=true;
        s.onload=()=> typeof window.initSendOTP==='function' ? resolve() : reject(new Error('MSG91 Widget unavailable'));
        s.onerror=()=>{s.remove(); index++; if(index<urls.length) attempt(); else reject(new Error('Cannot load OTP widget'));};
        document.head.append(s);
      }
      attempt();
    }).catch(err=>{scriptLoading=null;throw err;});
    return scriptLoading;
  }
  // MSG91 Web SDK callback returns the temporary verified access-token.
  function accessTokenFrom(result) {
    const token=typeof result==='string' ? result :
      (result?.message || result?.accessToken || result?.['access-token'] || result?.token || result?.data?.message);
    return typeof token==='string' && token.length>=20 ? token : null;
  }
  function mount(root) {
    if(root.dataset.localOtpMounted) return;
    root.dataset.localOtpMounted='1';
    const trigger=document.createElement('button');
    trigger.className='cl-otp-trigger'; trigger.type='button'; trigger.textContent='Login / Register';
    const status=document.createElement('span');
    status.className='cl-otp-status';status.setAttribute('role','status');
    root.append(trigger,status);
    let user=null, backendReady=false;
    trigger.disabled=true; trigger.textContent='Checking login…';
    const emit=()=>window.dispatchEvent(new CustomEvent('cerood-local-auth-changed',{detail:{user}}));
    function display() {
      trigger.textContent=user ? 'Logout' : (backendReady ? 'Login / Register' : 'Login unavailable');
      trigger.disabled=!backendReady;
      trigger.setAttribute('aria-label',user ? 'Logout from Cerood Local Discovery' : 'Login with OTP');
    }
    function show(msg,bad=false){status.textContent=msg||'';status.classList.toggle('cl-otp-error',bad);}
    trigger.addEventListener('click', async()=>{
      if(trigger.disabled || !backendReady) return;
      trigger.disabled=true;
      try {
        if(user) {
          await api('/logout',{});user=null;show('Logged out');display();emit();return;
        }
        if(!conf?.widgetId || !conf?.tokenAuth || conf.tokenAuth.startsWith('PASTE_')) {
          throw new Error('OTP Widget token is not configured in cerood-local-otp-config.js');
        }
        await loadWidget();
        show('');
        window.initSendOTP({
          widgetId:conf.widgetId, tokenAuth:conf.tokenAuth,
          // Leave identifier empty: MSG91 renders phone entry & captcha itself.
          identifier:'', exposeMethods:false,
          success:async data=>{
            try {
              const accessToken=accessTokenFrom(data);
              if(!accessToken) throw new Error('MSG91 did not return a verification token');
              const result=await api('/widget-login',{accessToken});
              user=result.user;display();emit();show('Mobile verified. Login successful.');
            } catch(err){show(err.message||'Login failed',true);}
          },
          failure:()=>show('OTP not verified. Try again.',true)
        });
      } catch(err){show(err.message||'Unable to open OTP',true);}
      finally {trigger.disabled=false;}
    });
    // Do not open the OTP popup (and incur SMS costs) until the Backend route is available.
    fetch(ENDPOINT+'/me',{method:'GET',credentials:'same-origin',headers:header})
      .then(async resp=>{
        if(resp.status===401){ backendReady=true; display(); return; }
        if(!resp.ok) throw new Error('Local Discovery authentication backend not ready');
        const data=await resp.json();
        if(!data.authenticated || !data.user) throw new Error('Unexpected auth server response');
        backendReady=true;user=data.user;display();emit();
      }).catch(()=>{backendReady=false;display();show('Login is not enabled yet.',true);});
  }
  function start() {document.querySelectorAll('[data-cerood-local-auth]').forEach(mount);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
