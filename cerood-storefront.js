(()=>{'use strict';
const form=document.querySelector('#siteSearch'),input=document.querySelector('#searchText');if(input)input.value=new URLSearchParams(location.search).get('q')||'';
if(form)form.addEventListener('submit',e=>{e.preventDefault();location.href='/shop.html?q='+encodeURIComponent(input.value.trim())+'#catalog'});
const notice=document.createElement('p');notice.className='store-toast';notice.setAttribute('role','status');notice.hidden=true;document.body.append(notice);let timer;
function message(text){notice.textContent=text;notice.hidden=false;clearTimeout(timer);timer=setTimeout(()=>notice.hidden=true,6000)}
document.addEventListener('click',e=>{const a=e.target.closest('[data-cerood-auth-trigger]');if(!a)return;if(window.CEROOD_DESIGN_PREVIEW){e.preventDefault();message('Sign-in is disabled in this private design preview.');return}if(!window.CeroodAuth){e.preventDefault();message('Sign-in could not load. Refresh this page and try again.');return}if(!window.CeroodAuth.isLoggedIn()){e.preventDefault();window.CeroodAuth.open()}});
// Broken product media gets an honest empty state instead of a broken image icon.
document.addEventListener('error',e=>{const image=e.target;if(image.tagName!=='IMG'||!image.closest('.catalog-photo,.hero-product,.main-image-container,.cerood-cart-row,.item,.rn-related-photo'))return;const label=document.createElement('span');label.className='photo-fallback';label.textContent='Photo unavailable';image.replaceWith(label)},true);
})();
