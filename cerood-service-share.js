(function(){
 'use strict';
 const icon='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m-4 4 4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
 function data(){
  const url=new URL(location.href);url.hash='';
  for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))url.searchParams.delete(key);
  const title=(document.getElementById('prodTitle')?.textContent||document.title||'Cerood service').trim();
  return {title,text:title+' | Cerood',url:url.href};
 }
 function whatsapp(d){const target='https://wa.me/?text='+encodeURIComponent(d.text+'\n'+d.url);const tab=window.open(target,'_blank','noopener,noreferrer');return tab;}
 function setup(){
  const gallery=document.querySelector('.main-image-container');if(!gallery)return;
  let button=gallery.querySelector('.cerood-product-share');
  if(!button){button=document.createElement('button');button.type='button';button.className='cerood-product-share';gallery.append(button);}
  button.innerHTML=icon;button.type='button';button.title='Share service';button.setAttribute('aria-label','Share this service');
  const style=document.createElement('style');style.id='cerood-native-share-style';style.textContent='.main-image-container>.cerood-product-share{position:absolute!important;right:14px!important;top:14px!important;display:grid!important;place-items:center!important;width:42px!important;height:42px!important;padding:0!important;border:1px solid #e4e9f0!important;border-radius:50%!important;background:#fff!important;color:#16365f!important;box-shadow:0 3px 12px #102a4310!important;cursor:pointer;z-index:3;transition:background .15s,transform .15s}.main-image-container>.cerood-product-share:hover{background:#f1f5f9!important}.main-image-container>.cerood-product-share:active{transform:scale(.94)}.main-image-container>.cerood-product-share:focus-visible{outline:3px solid #93b8f1;outline-offset:3px}@media(prefers-reduced-motion:reduce){.main-image-container>.cerood-product-share{transition:none}}';
  if(!document.getElementById(style.id))document.head.append(style);gallery.style.position='relative';
  button.onclick=function(){
   const d=data();
   // Call in the click handler without fetching/awaiting first: retain user activation.
   if(typeof navigator.share==='function'){
    if(button.dataset.sharing==='true')return;button.dataset.sharing='true';
    let result;try{result=navigator.share(d);}catch(_){button.dataset.sharing='false';whatsapp(d);return;}
    Promise.resolve(result).catch(error=>{
     if(error?.name==='AbortError')return;
     // No second automatic app launch after a rejected/cancelled share sheet.
     const old=button.getAttribute('aria-label');button.setAttribute('aria-label','Sharing unavailable. Try again.');button.title='Sharing unavailable. Try again.';
     setTimeout(()=>{button.setAttribute('aria-label',old||'Share this service');button.title='Share service';},4000);
    }).finally(()=>{button.dataset.sharing='false';});
   }else whatsapp(d);
  };
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
