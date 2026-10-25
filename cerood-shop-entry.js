/* Add a separate shopping entry to existing Home Services navigation. */
(()=>{'use strict';
function add(){const header=document.querySelector('.home-index-header');if(!header)return false;
const desktop=header.querySelector('.header-nav-right');if(desktop&&!desktop.querySelector('[data-cerood-shop-entry]')){const a=document.createElement('a');a.href='/shop.html';a.textContent='Shop';a.dataset.ceroodShopEntry='desktop';a.setAttribute('aria-label','Shop products on Cerood');a.style.cssText='display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 14px;border:1px solid #dce5df;border-radius:999px;background:#fff;color:#1b4731;font-size:13px;font-weight:600;white-space:nowrap;text-decoration:none;';desktop.prepend(a)}
const menu=header.querySelector('.cerood-mobile-index-menu-list');if(menu&&!menu.querySelector('[data-cerood-shop-entry]')){const a=document.createElement('a');a.href='/shop.html';a.textContent='Shop';a.dataset.ceroodShopEntry='mobile';menu.prepend(a)}
if(!menu){const nav=document.querySelector('.cerood-festival-tabs');if(nav&&!nav.querySelector('[data-cerood-shop-entry]')){const a=document.createElement('a');a.href='/shop.html';a.textContent='Shop ↗';a.dataset.ceroodShopEntry='mobile';a.style.cssText='display:inline-flex;align-items:center;padding:10px 14px;color:inherit;text-decoration:none;font-weight:600;white-space:nowrap;';nav.prepend(a)}}return !!(desktop||menu)}
function init(){if(add())return;const observer=new MutationObserver(()=>{if(add())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
