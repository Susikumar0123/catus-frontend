(function(){'use strict';
function model(sources){const seen=new Set(),images=[];for(const value of sources){if(typeof value!=='string'||!value.trim())continue;try{const u=new URL(value,typeof location==='undefined'?'https://www.cerood.com':location.href);if(!['https:','http:'].includes(u.protocol)||seen.has(u.href))continue;seen.add(u.href);images.push(u.href);}catch{}}return {images,visible:images.slice(0,4),remaining:Math.max(0,images.length-3)};}
if(typeof module==='object'&&module.exports)module.exports={model};
if(typeof document==='undefined')return;
function init(){
const gallery=document.querySelector('#productGridMain .product-gallery'),main=document.querySelector('#productGridMain .main-image-container'),thumbs=document.getElementById('thumbnailContainer');if(!gallery||!main||!thumbs)return;
const grid=document.createElement('div');grid.className='cerood-photo-grid';main.before(grid);grid.append(main);
let images=[],signature='',active=0,returnFocus;
const dialog=document.createElement('dialog');dialog.className='cerood-photo-viewer';dialog.setAttribute('aria-label','Service photos');
const close=document.createElement('button');close.type='button';close.className='cerood-photo-close';close.textContent='×';close.setAttribute('aria-label','Close gallery');
const full=document.createElement('img');full.alt='Service photo';
const nav=document.createElement('div');nav.className='cerood-photo-navigation';
const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');prev.type=next.type='button';prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','Previous image');next.setAttribute('aria-label','Next image');count.setAttribute('aria-live','polite');nav.append(prev,count,next);dialog.append(close,full,nav);document.body.append(dialog);
function show(index){if(!images.length)return;active=(index+images.length)%images.length;full.src=images[active];full.alt=(document.getElementById('prodTitle')?.textContent.trim()||'Service')+' — photo '+(active+1);count.textContent=(active+1)+' / '+images.length;prev.disabled=next.disabled=images.length<2;}
function open(index,source){returnFocus=source||document.activeElement;show(index);if(!dialog.open)dialog.showModal();close.focus();}
function hide(){dialog.close();}
close.addEventListener('click',hide);prev.addEventListener('click',()=>show(active-1));next.addEventListener('click',()=>show(active+1));dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();show(active+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(active-1);}});dialog.addEventListener('click',e=>{if(e.target===dialog)hide();});dialog.addEventListener('close',()=>{full.removeAttribute('src');returnFocus?.focus?.();});
const mainImage=document.getElementById('mainProductImage');mainImage?.addEventListener('click',()=>open(0,mainImage));if(mainImage){mainImage.tabIndex=0;mainImage.setAttribute('role','button');mainImage.setAttribute('aria-label','Open service photo gallery');mainImage.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(0,mainImage);}});}
function render(){const urls=Array.from(thumbs.querySelectorAll('img')).map(e=>e.dataset.fullImage||e.currentSrc||e.src);if(!urls.length&&mainImage?.getAttribute('src'))urls.push(mainImage.src);const m=model(urls);const sig=JSON.stringify(m.images);if(sig===signature)return;signature=sig;images=m.images;grid.querySelectorAll('.cerood-photo-tile').forEach(e=>e.remove());gallery.dataset.ceroodPhotoCount=String(images.length);if(images.length<2)return;
m.visible.slice(1).forEach((url,i)=>{const index=i+1,button=document.createElement('button');button.type='button';button.className='cerood-photo-tile';button.setAttribute('aria-label',index===3&&images.length>4?'View all '+images.length+' photos':'Open photo '+(index+1));const image=document.createElement('img');image.src=url;image.alt=(document.getElementById('prodTitle')?.textContent.trim()||'Service')+' — photo '+(index+1);image.loading='lazy';button.append(image);if(index===3&&images.length>4){const overlay=document.createElement('span');overlay.className='cerood-photo-more';overlay.textContent='+'+m.remaining;button.append(overlay);}button.addEventListener('click',()=>open(index,button));grid.append(button);});}
new MutationObserver(render).observe(thumbs,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-full-image']});if(mainImage)new MutationObserver(render).observe(mainImage,{attributes:true,attributeFilter:['src']});render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
