(function(){'use strict';
const base='/brand/',primary=base+'logo.png',reverse=base+'logo-white.png';
function dark(node){for(let e=node;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor,m=c.match(/[\d.]+/g);if(!m||m.length>3&&Number(m[3])<.1)continue;const [r,g,b]=m.map(Number);return .2126*r+.7152*g+.0722*b<140;}return false;}
function upgrade(root){if(!root?.querySelectorAll)return;
 for(const host of root.querySelectorAll('header .brand,aside>a.brand,.topbar .brand,a.wordmark,a.brand-logo,a.cr-logo')){
  if(host.dataset.ceroodBrand==='1')continue;
  // Preserve links, click handlers and workspace labels. Never target product logos.
  host.dataset.ceroodBrand='1';host.classList.add('cerood-brand-lockup');
  for(const n of [...host.childNodes]){if(n.nodeType===3){if(n.textContent.trim())n.textContent='';}else if(n.nodeType===1&&n.tagName!=='SMALL'){n.setAttribute('data-cerood-old-brand','');n.style.setProperty('display','none','important');}}
  const img=document.createElement('img');img.src=dark(host)?reverse:primary;img.alt='Cerood';img.width=160;img.height=40;img.className='cerood-brand-image';host.prepend(img);
 }
 for(const img of root.querySelectorAll('img[src*="cerood-logo.webp"],img.cr-footer-logo,img.cerood-original-c-logo')){
  if(img.closest('[data-cerood-old-brand]'))continue;
  img.src=dark(img)?reverse:primary;img.alt='Cerood';img.classList.add('cerood-brand-replaced');
 }
}
function start(){upgrade(document);new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1){if(n.matches('img.cerood-brand-image'))continue;upgrade(n.parentElement||n);}}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
