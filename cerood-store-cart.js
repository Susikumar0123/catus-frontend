
(()=>{'use strict';
 const API=location.hostname==='localhost'?'http://localhost:3000':'https://catus-backend-d2js.onrender.com';
 const stores=[
  {key:'general',label:'Main Store',storage:'cerood_shop_cart',api:'/api/shop/products'},
  {key:'renewed',label:'Renewed',storage:'cerood_renewed_cart',api:'/api/renewed/products'},
  {key:'fashion',label:'Fashion',storage:'cerood_clothing_cart',api:'/api/clothing/products'},
  {key:'beauty',label:'Beauty',storage:'cerood_cosmetics_cart',api:'/api/cosmetics/products'}
 ];
 const popup=document.getElementById('ceroodCommonCartPopup'),body=document.getElementById('ceroodCommonCartBody');
 const catalog=new Map(); let renderToken=0,previousFocus=null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
 function read(s){try{const a=JSON.parse(localStorage.getItem(s.storage)||'[]');return Array.isArray(a)?a.filter(x=>x&&x.product_id&&Number(x.quantity)>0):[]}catch{return[]}}
 function write(s,a){localStorage.setItem(s.storage,JSON.stringify(a))}
 function total(){return stores.reduce((n,s)=>n+read(s).reduce((a,x)=>a+Number(x.quantity||0),0),0)}
 function updateBadges(){const n=total();document.querySelectorAll('[data-cerood-cart-count],.cr-cart b').forEach(x=>x.textContent=String(n))}
 function normalizeList(d){if(Array.isArray(d))return d;if(Array.isArray(d?.products))return d.products;if(Array.isArray(d?.items))return d.items;if(Array.isArray(d?.data))return d.data;return[]}
 function img(p){return window.CeroodShopModel.image(p,location.origin)}
 async function loadCatalog(s){
   const key=s.key;if(catalog.has(key))return catalog.get(key);
   try{const r=await fetch(API+s.api,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error();const m=new Map(normalizeList(d).map(p=>[String(p.id??p.product_id),p]));catalog.set(key,m);return m}catch{return new Map()}
 }
 function remove(store,index){const s=stores.find(x=>x.key===store);if(!s)return;const a=read(s);if(!Number.isInteger(index)||index<0||index>=a.length)return;a.splice(index,1);write(s,a);render();updateBadges()}
 function qty(store,index,delta){const s=stores.find(x=>x.key===store);if(!s)return;const a=read(s),x=a[index];if(!Number.isInteger(index)||!x)return;const p=catalog.get(store)?.get(String(x.product_id)),max=Math.max(1,window.CeroodShopModel.quantityLimit(p,x));x.quantity=Math.max(1,Math.min(max,Number(x.quantity||1)+delta));write(s,a);render();updateBadges()}
 async function render(){
  const token=++renderToken,groups=stores.map(s=>({s,items:read(s)})).filter(x=>x.items.length);
  if(!groups.length){body.innerHTML='<div class="cerood-cart-empty"><b>Your cart is empty</b>Add a product and it will appear here.</div>';return}
  body.innerHTML='<div class="cerood-cart-loading">Loading product details…</div>';
  const maps=await Promise.all(groups.map(g=>loadCatalog(g.s)));if(token!==renderToken)return;
  body.innerHTML=groups.map((g,gi)=>{
    const map=maps[gi];let subtotal=0;
    const rows=g.items.map((x,index)=>{
      const p=map.get(String(x.product_id))||{},q=Math.max(1,Number(x.quantity||1)),price=Number(window.CeroodShopModel.variant(p,x)?.price??p.price??p.sale_price??p.unit_price??0),line=price*q;subtotal+=line;
      const name=p.name||p.product_name||'Product',url=img(p),limit=window.CeroodShopModel.quantityLimit(p,x);
      return `<div class="cerood-cart-row">${url?`<img class="cerood-cart-img" src="${esc(url)}" alt="${esc(name)}" loading="lazy">`:`<div class="cerood-cart-img cerood-cart-img-fallback">No image</div>`}<div class="cerood-cart-info"><a class="cerood-cart-name" href="/shop-product.html?store=${encodeURIComponent(g.s.key)}&id=${encodeURIComponent(x.product_id)}">${esc(name)}</a>${x.variant_values&&Object.keys(x.variant_values).length?`<div class="cerood-cart-line">${esc(Object.entries(x.variant_values).map(([k,v])=>k+': '+v).join(' · '))}</div>`:''}<div class="cerood-cart-price">${price?money(price):'Price at checkout'}</div><div class="cerood-cart-line">${price?`${money(price)} × ${q} = ${money(line)}`:`Qty ${q}`}</div></div><div class="cerood-cart-side"><button type="button" class="cerood-cart-remove" data-remove-store="${g.s.key}" data-remove-index="${index}">Remove</button><div class="cerood-cart-qty"><button type="button" aria-label="Decrease quantity" ${q<=1?'disabled':''} data-qty-store="${g.s.key}" data-qty-index="${index}" data-delta="-1">−</button><b>${q}</b><button type="button" aria-label="Increase quantity" ${q>=limit?'disabled':''} data-qty-store="${g.s.key}" data-qty-index="${index}" data-delta="1">+</button></div></div></div>`;
    }).join('');
    return `<section class="cerood-cart-store"><div class="cerood-cart-store-head"><strong>${g.s.label}</strong><span>${g.items.reduce((n,x)=>n+Number(x.quantity||0),0)} item(s)</span></div>${rows}<div class="cerood-cart-store-summary"><span>Subtotal</span><b>${subtotal?money(subtotal):'Calculated at checkout'}</b></div><div class="cerood-cart-store-actions"><button type="button" class="cerood-cart-checkout" data-checkout-store="${g.s.key}">Proceed to checkout</button></div></section>`;
  }).join('');
 }
 function open(){previousFocus=document.activeElement;popup.hidden=false;popup.setAttribute('aria-hidden','false');document.body.classList.add('cerood-cart-open');render();popup.querySelector('.cerood-cart-close')?.focus()}
 function close(){popup.hidden=true;popup.setAttribute('aria-hidden','true');document.body.classList.remove('cerood-cart-open');if(previousFocus?.isConnected)previousFocus.focus()}
 document.addEventListener('click',e=>{
  const opener=e.target.closest('[data-cerood-cart-open]');if(opener){e.preventDefault();open();return}
  if(e.target.closest('[data-cerood-cart-close]')){close();return}
  const rem=e.target.closest('[data-remove-store]');if(rem){remove(rem.dataset.removeStore,Number(rem.dataset.removeIndex));return}
  const q=e.target.closest('[data-qty-store]');if(q){qty(q.dataset.qtyStore,Number(q.dataset.qtyIndex),Number(q.dataset.delta));return}
  const go=e.target.closest('[data-checkout-store]');if(go){location.href='/shop-checkout.html?store='+encodeURIComponent(go.dataset.checkoutStore)+'&mode=cart'}
 });
 document.addEventListener('keydown',e=>{if(popup.hidden)return;if(e.key==='Escape'){close();return}if(e.key==='Tab'){const elements=[...popup.querySelectorAll('.cart-drawer button:not(:disabled),.cart-drawer a[href],.cart-drawer input')].filter(x=>x.getClientRects().length);const first=elements[0],last=elements[elements.length-1];if(!popup.contains(document.activeElement)){e.preventDefault();first?.focus()}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});
 window.addEventListener('storage',()=>{catalog.clear();updateBadges();if(!popup.hidden)render()});
 ['shop-cart-updated','renewed-cart-updated','fashion-cart-updated','beauty-cart-updated'].forEach(n=>window.addEventListener(n,()=>{catalog.clear();updateBadges();if(!popup.hidden)render()}));
 updateBadges();
})();
