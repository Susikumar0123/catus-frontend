
(()=>{'use strict';

const API_BASE='https://catus-backend-d2js.onrender.com';
const STORES={
  general:{key:'general',label:'Main Store',endpoint:'/api/shop/products',cart:'cerood_shop_cart',buy:'cerood_shop_buy_now',event:'shop-cart-updated',checkout:'/shop-checkout.html?store=general&mode=buy'},
  renewed:{key:'renewed',label:'Renewed',endpoint:'/api/renewed/products',cart:'cerood_renewed_cart',buy:'cerood_renewed_buy_now',event:'renewed-cart-updated',checkout:'/shop-checkout.html?store=renewed&mode=buy'},
  fashion:{key:'fashion',label:'Fashion',endpoint:'/api/clothing/products',cart:'cerood_clothing_cart',buy:'cerood_clothing_buy_now',event:'fashion-cart-updated',checkout:'/shop-checkout.html?store=fashion&mode=buy'},
  beauty:{key:'beauty',label:'Beauty',endpoint:'/api/cosmetics/products',cart:'cerood_cosmetics_cart',buy:'cerood_cosmetics_buy_now',event:'beauty-cart-updated',checkout:'/shop-checkout.html?store=beauty&mode=buy'}
};
const aliases={shop:'general',main:'general',clothing:'fashion',cosmetics:'beauty'};
const $=id=>document.getElementById(id);
let ceroodSelectedOffer=null;
let ceroodRecommendedOffer=null;
let ceroodBaseProduct=null;
let ceroodSelectedVariant=null;
let ceroodVariantSelection={};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=value=>window.CeroodShopModel.safeURL(value,location.origin)||null;
const obj=v=>{if(!v)return{};if(typeof v==='string'){try{const x=JSON.parse(v);return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return{}}}return typeof v==='object'&&!Array.isArray(v)?v:{}};
const human=k=>String(k||'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const textValue=v=>Array.isArray(v)?v.join(', '):(v&&typeof v==='object'?Object.entries(v).map(([k,x])=>human(k)+': '+textValue(x)).join(', '):String(v??''));
const state=(title,message)=>{$('product').hidden=true;$('state').hidden=false;$('stateTitle').textContent=title;$('stateMessage').textContent=message};

function sectionOf(id){return $(id)?.closest('.section')||null}
function setSection(id,show){const s=sectionOf(id);if(s)s.hidden=!show}
function list(id,items,empty){
 const el=$(id); el.replaceChildren();
 const arr=Array.isArray(items)?items.filter(v=>v!==null&&v!==undefined&&String(v).trim()!==''):[];
 if(!arr.length){const li=document.createElement('li');li.textContent=empty;el.append(li);return}
 arr.forEach(v=>{const li=document.createElement('li');li.textContent=textValue(v);el.append(li)});
}
function productMedia(p){
 const out=[],seen=new Set();
 const add=(url,alt,type)=>{const u=safeUrl(url);if(!u||seen.has(u))return;seen.add(u);out.push({url:u,alt:alt||p.name||'Product image',type:type||(/\.mp4|\.webm/i.test(u)?'video':'image')})};
 const imgs=p.product_images;
 if(Array.isArray(imgs)) imgs.forEach((x,i)=>typeof x==='string'?add(x,`${p.name||'Product'} image ${i+1}`):x&&add(x.url||x.image_url,x.label||x.slot_key,x.type));
 else if(imgs&&typeof imgs==='object') Object.entries(imgs).forEach(([k,v])=>{
   if(Array.isArray(v))v.forEach((x,i)=>typeof x==='string'?add(x,human(k)+' '+(i+1)):x&&add(x.url||x.image_url,x.label||human(k),x.type));
   else if(typeof v==='string')add(v,human(k));
   else if(v)add(v.url||v.image_url,v.label||human(k),v.type);
 });
 if(Array.isArray(p.media))p.media.forEach((x,i)=>typeof x==='string'?add(x,`Product media ${i+1}`):x&&add(x.url||x.image_url,x.alt||`Product media ${i+1}`,x.type));
 add(p.image_url||p.image,'Main product image');
 add(p.video_url,'Product video','video');
 return out;
}
function showMedia(media){
 const root=$('gallery'),thumbs=$('thumbs');thumbs.replaceChildren();
 const list=Array.isArray(media)?media.filter(x=>safeUrl(x?.url)):[];
 if(!list.length){root.innerHTML='<span class="media-placeholder">📷<small>Product photo not uploaded</small></span>';return}
 let current=0,touchStart=null,lightbox=null;
 const isVideo=m=>String(m.type||'').toLowerCase()==='video';
 const make=m=>{const e=document.createElement(isVideo(m)?'video':'img');e.src=safeUrl(m.url);if(isVideo(m)){e.controls=true;e.playsInline=true;e.preload='metadata'}else{e.alt=String(m.alt||'Product image');e.draggable=false}return e};
 const display=i=>{
   current=(i+list.length)%list.length;root.replaceChildren(make(list[current]));
   thumbs.querySelectorAll('button').forEach((b,n)=>b.classList.toggle('active',n===current));
   if(list.length>1){
     const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
     prev.type=next.type='button';prev.className='cr-gallery-arrow cr-gallery-prev';next.className='cr-gallery-arrow cr-gallery-next';
     prev.textContent='‹';next.textContent='›';count.className='cr-gallery-counter';count.textContent=`${current+1} / ${list.length}`;
     prev.onclick=()=>display(current-1);next.onclick=()=>display(current+1);root.append(prev,next,count);
   }
   const ex=document.createElement('button');ex.type='button';ex.className='cr-gallery-expand';ex.textContent='⛶ Full view';ex.onclick=()=>openLight();root.append(ex);
   if(lightbox)drawLight();
 };
 const drawLight=()=>{const area=lightbox.querySelector('.cr-gallery-lightbox-media');area.replaceChildren(make(list[current]));lightbox.querySelector('.cr-gallery-light-count').textContent=`${current+1} / ${list.length}`};
 const closeLight=()=>{if(!lightbox)return;lightbox.remove();lightbox=null;document.body.style.overflow=''};
 const openLight=()=>{if(lightbox)return;lightbox=document.createElement('div');lightbox.className='cr-gallery-lightbox';lightbox.innerHTML='<div class="cr-gallery-lightbox-media"></div><button class="cr-gallery-close">×</button><button class="cr-gallery-light-prev">‹</button><button class="cr-gallery-light-next">›</button><span class="cr-gallery-light-count"></span>';document.body.append(lightbox);document.body.style.overflow='hidden';lightbox.querySelector('.cr-gallery-close').onclick=closeLight;lightbox.querySelector('.cr-gallery-light-prev').onclick=()=>display(current-1);lightbox.querySelector('.cr-gallery-light-next').onclick=()=>display(current+1);lightbox.onclick=e=>{if(e.target===lightbox)closeLight()};drawLight()};
 list.forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.className='thumb';if(isVideo(m))b.textContent='▶ Video';else{const im=document.createElement('img');im.src=safeUrl(m.url);im.alt=m.alt||`Photo ${i+1}`;b.append(im)}b.onclick=()=>display(i);thumbs.append(b)});
 root.addEventListener('touchstart',e=>touchStart=e.touches[0]?.clientX??null,{passive:true});root.addEventListener('touchend',e=>{if(touchStart===null)return;const dx=(e.changedTouches[0]?.clientX??touchStart)-touchStart;touchStart=null;if(Math.abs(dx)>45&&list.length>1)display(current+(dx<0?1:-1))},{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLight();if(lightbox&&e.key==='ArrowLeft')display(current-1);if(lightbox&&e.key==='ArrowRight')display(current+1)});
 display(0);
}
function setSpecs(p,store){
 const attrs={...obj(p.specifications),...obj(p.product_attributes)};
 const legacy={};
 if(store==='fashion'){['variant','shade','size','color','colour','fabric','material','fit','net_quantity','manufacturer','importer'].forEach(k=>{if(p[k]!=null&&String(p[k]).trim())legacy[k]=p[k]})}
 if(store==='beauty'){['variant','shade','net_quantity','net_qty','ingredients','expiry_date','expiry','manufacturer'].forEach(k=>{if(p[k]!=null&&String(p[k]).trim())legacy[k]=p[k]})}
 const merged={...legacy,...attrs},spec=$('specifications');spec.replaceChildren();
 const entries=Object.entries(merged).filter(([,v])=>v!==null&&v!==''&&!(Array.isArray(v)&&!v.length));
 if(!entries.length){spec.textContent='Specifications not provided by seller.';return}
 entries.forEach(([k,v])=>{const row=document.createElement('p'),strong=document.createElement('strong');strong.textContent=human(k)+': ';row.append(strong,document.createTextNode(textValue(v)));spec.append(row)});
}
function setInfo(p,store){
 const items=[];
 if(store==='renewed'){
   if(Array.isArray(p.accessories))items.push(...p.accessories);
   else if(p.accessories)items.push(p.accessories);
 }else{
   if(p.category)items.push('Category: '+p.category);
   if(p.subcategory)items.push('Subcategory: '+p.subcategory);
   if(p.brand)items.push('Brand: '+p.brand);
   if(p.model)items.push('Model: '+p.model);
 }
 list('accessories',items,'Additional product information not provided.');
}
function warrantyData(p){
 const days=Number(p.warranty_days||p.warranty_days_at_purchase||0);
 const terms=String(p.warranty_terms||'').trim();
 return {days:Number.isFinite(days)&&days>0?days:0,terms,has:(Number.isFinite(days)&&days>0)||!!terms};
}
function ceroodVariantPayload(){
 if(!ceroodSelectedVariant)return{};
 return {variant_id:ceroodSelectedVariant.id||null,variant_sku:ceroodSelectedVariant.sku||'',variant_values:{...(ceroodSelectedVariant.variant_values||{})}};
}
function ceroodEffectivePurchase(p){
 const v=ceroodSelectedVariant,o=ceroodSelectedOffer,r=ceroodRecommendedOffer;
 const price=Number(v?.price ?? o?.price ?? r?.price ?? p.price),compare=Number(v?.compare_price ?? o?.compare_price ?? r?.compare_price ?? p.compare_price);
 const variantStock=v?Number(v.stock):Infinity,offerStock=o?Number(o.stock):(r?Number(r.stock):Infinity),baseStock=r?Infinity:Number(p.stock);
 const stock=Math.max(0,Math.min(Number.isFinite(variantStock)?variantStock:Infinity,Number.isFinite(offerStock)?offerStock:Infinity,Number.isFinite(baseStock)&&baseStock>=0?baseStock:Infinity));
 return {price,compare,stock:Number.isFinite(stock)?stock:0};
}
function saveCart(cfg,id,p){
 let cart=[];try{cart=JSON.parse(localStorage.getItem(cfg.cart)||'[]');if(!Array.isArray(cart))cart=[]}catch{}
 if(ceroodVariantList(p).length&&!ceroodSelectedVariant){alert('Please choose the product options first.');return}
 const listingId=cfg.key==='renewed'&&ceroodSelectedOffer?String(ceroodSelectedOffer.seller_listing_id||''):'';
 const purchase=ceroodEffectivePurchase(p),vp=ceroodVariantPayload(),variantKey=JSON.stringify(vp.variant_values||{});
 const existing=cart.find(x=>String(x.product_id)===String(id)&&String(x.seller_listing_id||'')===listingId&&String(x.variant_id||'')===String(vp.variant_id||'')&&JSON.stringify(x.variant_values||{})===variantKey);
 if(existing){if(existing.quantity>=purchase.stock){alert('Only '+purchase.stock+' available for this option.');return}existing.quantity++}
 else cart.push({product_id:id,quantity:1,store:cfg.key,...(listingId?{seller_listing_id:listingId}:{}),...vp});
 localStorage.setItem(cfg.cart,JSON.stringify(cart));window.dispatchEvent(new Event(cfg.event));
 $('cartFeedback').textContent=`Added to ${cfg.label} cart.`;$('cart').textContent='Added ✓';setTimeout(()=>{$('cart').textContent='Add to Cart'},1800);
}

function ceroodVariantList(p){
 const raw=Array.isArray(p.product_variants)?p.product_variants:(Array.isArray(p.variants)?p.variants:[]);
 return raw.map((v,i)=>{let values=obj(v.variant_values);return {...v,id:v.id||v.variant_id||'',_i:i,variant_values:values,stock:Number(v.stock||0),price:Number(v.price||0),compare_price:v.compare_price==null?null:Number(v.compare_price)}}).filter(v=>Object.keys(v.variant_values).length);
}
function ceroodVariantMatch(variants,selection,requireAll=false){
 const keys=Object.keys(selection);return variants.filter(v=>keys.every(k=>String(v.variant_values?.[k]??'')===String(selection[k]))&&(requireAll?Object.keys(v.variant_values||{}).every(k=>selection[k]!=null):true));
}
function ceroodRenderVariants(p){
 const box=$('ceroodVariantBox'),root=$('ceroodVariantOptions'),msg=$('ceroodVariantMessage'),variants=ceroodVariantList(p);
 ceroodSelectedVariant=null;ceroodVariantSelection={};root.replaceChildren();
 if(!variants.length){box.hidden=true;return}
 box.hidden=false;
 const keys=[];variants.forEach(v=>Object.keys(v.variant_values).forEach(k=>{if(!keys.includes(k))keys.push(k)}));
 const groups={};
 keys.forEach(key=>{
   const group=document.createElement('div');group.className='cr-variant-group';
   const label=document.createElement('span');label.className='cr-variant-label';label.textContent='Select '+human(key);
   const values=document.createElement('div');values.className='cr-variant-values';group.append(label,values);root.append(group);groups[key]=values;
   [...new Set(variants.map(v=>v.variant_values[key]).filter(v=>v!=null&&String(v)!==''))].forEach(value=>{
     const b=document.createElement('button');b.type='button';b.className='cr-variant-value';b.textContent=String(value);b.dataset.value=String(value);
     b.onclick=()=>{ceroodVariantSelection[key]=String(value);ceroodRefreshVariantUI(p,variants,keys,groups);};values.append(b);
   });
 });
 msg.textContent='Choose '+keys.map(human).join(' and ')+' to continue.';
 ceroodRefreshVariantUI(p,variants,keys,groups);
}
function ceroodRefreshVariantUI(p,variants,keys,groups){
 keys.forEach(key=>{
   groups[key].querySelectorAll('button').forEach(btn=>{
     const trial={...ceroodVariantSelection,[key]:btn.dataset.value};
     const possible=ceroodVariantMatch(variants,trial).some(v=>Number(v.stock)>0);
     btn.disabled=!possible;const selected=String(ceroodVariantSelection[key]??'')===btn.dataset.value;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));
   });
 });
 const complete=keys.every(k=>ceroodVariantSelection[k]!=null),matches=complete?ceroodVariantMatch(variants,ceroodVariantSelection,true):[];
 ceroodSelectedVariant=matches.find(v=>Number(v.stock)>0)||matches[0]||null;
 const msg=$('ceroodVariantMessage');
 if(!complete){msg.textContent='Choose '+keys.filter(k=>ceroodVariantSelection[k]==null).map(human).join(' and ')+' to continue.';}
 else if(!ceroodSelectedVariant||Number(ceroodSelectedVariant.stock)<=0){msg.textContent='This option is currently out of stock.';}
 else{msg.innerHTML='<strong>'+esc(keys.map(k=>human(k)+': '+ceroodVariantSelection[k]).join(' · '))+'</strong>'+(ceroodSelectedVariant.sku?' · SKU '+esc(ceroodSelectedVariant.sku):'');}
 ceroodRefreshPurchaseDisplay(p);
}
function ceroodRefreshPurchaseDisplay(p){
 const purchase=ceroodEffectivePurchase(p),hasVariants=ceroodVariantList(p).length>0,ready=!hasVariants||!!ceroodSelectedVariant;
 $('price').textContent=Number.isFinite(purchase.price)&&purchase.price>0?'₹'+purchase.price.toLocaleString('en-IN'):'Price to be confirmed';
 $('comparePrice').textContent=purchase.compare>purchase.price?'₹'+purchase.compare.toLocaleString('en-IN'):'';
 $('discount').textContent=purchase.compare>purchase.price&&purchase.price>0?Math.round((purchase.compare-purchase.price)*100/purchase.compare)+'% off':'';
 $('stock').textContent=!ready?'Choose options':purchase.stock>0?`${purchase.stock} available`:'Sold out';
 const available=ready&&purchase.stock>0&&purchase.price>0;$('cart').disabled=!available;$('buy').disabled=!available;
 $('purchaseNote').textContent=!ready?'Select the available product options before purchasing.':available?'This product option is ready to purchase.':'This product option is currently out of stock.';
}

function ceroodRefreshBankOffer(price){
 const box=$('ceroodBankOffer');
 if(box)box.hidden=true; // Show bank offers only when a verified backend/payment promotion feed is connected.
}

function ceroodApplyOffer(p,offer){
 ceroodSelectedOffer=offer||null;
 const price=Number(offer?.price ?? p.price),cp=Number(offer?.compare_price ?? p.compare_price);
 const stock=Number(offer?.stock ?? p.stock);
 ceroodRefreshBankOffer(price);
 $('price').textContent=Number.isFinite(price)&&price>0?'₹'+price.toLocaleString('en-IN'):'Price to be confirmed';
 $('comparePrice').textContent=cp>price?'₹'+cp.toLocaleString('en-IN'):'';
 $('discount').textContent=cp>price&&price>0?Math.round((cp-price)*100/cp)+'% off':'';
 $('stock').textContent=stock>0?`${stock} available`:'Sold out';
 if(offer){
   const seller=$('ceroodSelectedSeller');
   seller.innerHTML='<div><strong>'+esc(offer.shop_name||offer.owner_name||'Cerood Seller')+'</strong><small>'+esc(offer.condition||'')+(offer.warranty_days?' · '+esc(offer.warranty_days)+' day(s) warranty':'')+(offer.dispatch_days?' · Dispatch in '+esc(offer.dispatch_days)+' day(s)':'')+'</small></div><b>₹'+Number(offer.price||0).toLocaleString('en-IN')+'</b>';
 }
 if(ceroodBaseProduct&&ceroodVariantList(ceroodBaseProduct).length)ceroodRefreshPurchaseDisplay(ceroodBaseProduct);
 else {const available=stock>0&&price>0;$('cart').disabled=!available;$('buy').disabled=!available;}
}

// Seller choice is intentionally not exposed on the customer product page.
// Renewed checkout sends no seller_listing_id by default; the backend allocates
// the best eligible seller and locks that exact listing during checkout.

function ceroodReadDeliveryPincode(){
 const keys=['cerood_selected_location','cerood_renewed_delivery_location','cerood_renewed_saved_address_v1','cerood_delivery_location','cerood_saved_address'];
 for(const key of keys){
   try{
     const raw=localStorage.getItem(key);if(!raw)continue;
     const value=JSON.parse(raw);
     const candidates=[value?.pincode,value?.postal_code,value?.postalCode,value?.zip,value?.address?.pincode,value?.delivery_address?.pincode];
     for(const candidate of candidates){const pin=String(candidate||'').replace(/\D/g,'').slice(0,6);if(/^[1-9]\d{5}$/.test(pin))return pin;}
   }catch{}
 }
 const labels=[$('locationText')?.textContent,$('mobileLocationText')?.textContent];
 for(const label of labels){const m=String(label||'').match(/\b([1-9]\d{5})\b/);if(m)return m[1];}
 return '';
}

let ceroodRecommendedOfferRequest=0;
async function ceroodLoadRecommendedOffer(productId,p){
 const requestId=++ceroodRecommendedOfferRequest;
 try{
   const pincode=ceroodReadDeliveryPincode();
   const qs=new URLSearchParams({quantity:'1'});if(pincode)qs.set('pincode',pincode);
   const r=await fetch(API_BASE+'/api/renewed/products/'+encodeURIComponent(productId)+'/recommended-offer?'+qs.toString(),{headers:{Accept:'application/json'},cache:'no-store'});
   if(!r.ok)throw Error('Recommended offer unavailable');
   const d=await r.json();
   if(requestId!==ceroodRecommendedOfferRequest||!d||d.success!==true)return;
   ceroodRecommendedOffer={
     price:Number(d.price||0),
     compare_price:d.compare_price==null?null:Number(d.compare_price),
     stock:Number(d.stock||0),
     warranty_days:Number(d.warranty_days||0),
     dispatch_days:d.dispatch_days==null?null:Number(d.dispatch_days),
     delivery_pincode:String(d.delivery_pincode||pincode||''),
     min_delivery_days:d.min_delivery_days==null?null:Number(d.min_delivery_days),
     max_delivery_days:d.max_delivery_days==null?null:Number(d.max_delivery_days),
     estimated_delivery_days:d.estimated_delivery_days==null?null:Number(d.estimated_delivery_days),
     serviceable:d.serviceable!==false,
     available:d.available===true
   };
   ceroodRefreshPurchaseDisplay(p);
   ceroodRefreshBankOffer(ceroodEffectivePurchase(p).price);
   if(ceroodRecommendedOffer.warranty_days>0)$('warranty').textContent=ceroodRecommendedOffer.warranty_days+' day(s) warranty';
   const note=$('purchaseNote');
   if(note){
     if(ceroodRecommendedOffer.delivery_pincode&&!ceroodRecommendedOffer.serviceable)
       note.textContent='Delivery is not available to '+ceroodRecommendedOffer.delivery_pincode+' for this product.';
     else if(!ceroodRecommendedOffer.available) note.textContent='This product is currently out of stock.';
     else if(ceroodRecommendedOffer.delivery_pincode&&ceroodRecommendedOffer.min_delivery_days!=null&&ceroodRecommendedOffer.max_delivery_days!=null)
       note.textContent='Delivery available to '+ceroodRecommendedOffer.delivery_pincode+' · Estimated '+ceroodRecommendedOffer.min_delivery_days+'–'+ceroodRecommendedOffer.max_delivery_days+' day(s). India-wide delivery. Final seller is locked securely at checkout.';
     else if(ceroodRecommendedOffer.delivery_pincode&&ceroodRecommendedOffer.estimated_delivery_days>0)
       note.textContent='Delivery available to '+ceroodRecommendedOffer.delivery_pincode+' · Estimated in '+ceroodRecommendedOffer.estimated_delivery_days+' day(s). India-wide delivery. Final seller is locked securely at checkout.';
     else if(ceroodRecommendedOffer.dispatch_days>0)
       note.textContent='Ready to purchase · Dispatch in '+ceroodRecommendedOffer.dispatch_days+' day(s). Select delivery location for an estimated delivery time.';
     else note.textContent='This product is ready to purchase. Select delivery location for an estimated delivery time.';
   }
 }catch(e){
   if(requestId===ceroodRecommendedOfferRequest)console.warn('Cerood recommended offer unavailable; using product fallback.',e);
 }
}

function ceroodRefreshRecommendedOfferForLocation(){
 if(document.documentElement.dataset.crStore!=='renewed'||!ceroodBaseProduct)return;
 const id=new URLSearchParams(location.search).get('id')||ceroodBaseProduct.id;
 if(id)ceroodLoadRecommendedOffer(String(id),ceroodBaseProduct);
}
let ceroodLastDeliveryPincode='';
function ceroodWatchDeliveryLocation(){
 const refresh=()=>{const pin=ceroodReadDeliveryPincode();if(pin!==ceroodLastDeliveryPincode){ceroodLastDeliveryPincode=pin;ceroodRefreshRecommendedOfferForLocation();}};
 ceroodLastDeliveryPincode=ceroodReadDeliveryPincode();
 window.addEventListener('storage',refresh);
 window.addEventListener('focus',refresh);
 ['cerood-location-updated','cerood-location-changed','cerood-delivery-location-updated','cerood-address-updated'].forEach(name=>window.addEventListener(name,refresh));
 document.addEventListener('click',e=>{if(e.target.closest('#desktopLocationButton,#mobileLocationButton'))setTimeout(refresh,400)});
 setInterval(refresh,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ceroodWatchDeliveryLocation,{once:true});else ceroodWatchDeliveryLocation();

function render(p,store){
 const cfg=STORES[store];$('state').hidden=true;$('product').hidden=false;
 document.documentElement.dataset.crStore=store;
 const name=String(p.name||'Product'),category=String(p.category_name||p.subcategory||p.category||cfg.label);
 $('name').textContent=name;$('crumbName').textContent=name;document.title=`${name} | Cerood ${cfg.label}`;
 $('category').textContent=category.toUpperCase();$('storeLabel').textContent='CEROOD '+cfg.label.toUpperCase();
 const brand=String(p.brand||'').trim();
 $('conditionBadge').textContent=store==='renewed'?String(p.condition||'Renewed Product'):(String(p.product_type||brand||cfg.label));
 $('model').textContent=[brand,p.model,p.variant,p.shade].filter(Boolean).join(' · ')||category;
 const price=Number(p.price),cp=Number(p.compare_price);
 $('price').textContent=Number.isFinite(price)&&price>0?'₹'+price.toLocaleString('en-IN'):'Price to be confirmed';
 $('comparePrice').textContent=cp>price?'₹'+cp.toLocaleString('en-IN'):'';
 $('discount').textContent=cp>price&&price>0?Math.round((cp-price)*100/cp)+'% off':'';
 $('stock').textContent=Number(p.stock)>0?`${Number(p.stock)} available`:'Sold out';
 ceroodRefreshBankOffer(price);
 $('location').textContent=brand||String(p.location||'Not specified');
 $('delivery').textContent=String(p.model||p.delivery||'Not specified');
 $('conditionText').textContent=String(p.description||p.short_description||p.condition_description||p.condition||'Product description not provided by seller.');
 const defects=String(p.known_defects||'').trim();$('defects').hidden=!defects;$('defects').textContent=defects?`Known defects: ${defects}`:'';
 setInfo(p,store);setSpecs(p,store);showMedia(productMedia(p));
 const w=warrantyData(p);
 if(w.has){
   $('warranty').textContent=w.days?`${w.days} day(s) warranty`:'Seller warranty';
   $('warrantyTerms').textContent=w.terms||(w.days?`Seller warranty: ${w.days} day(s). Warranty period starts after delivery.`:'Seller warranty applies.');
   setSection('warrantyTerms',true);
 }else{
   $('warranty').textContent='No seller warranty';
   setSection('warrantyTerms',false);
 }
 const available=Number(p.stock)>0&&price>0;$('cart').disabled=!available;$('buy').disabled=!available;
 const id=new URLSearchParams(location.search).get('id');
 ceroodBaseProduct=p;
 ceroodRecommendedOffer=null;
 ceroodRenderVariants(p);
 if(store==='renewed'&&id)ceroodLoadRecommendedOffer(id,p);
 $('cart').onclick=()=>id&&saveCart(cfg,id,p);
 $('buy').onclick=()=>{
   if(!id||$('buy').disabled)return;
   if(ceroodVariantList(p).length&&!ceroodSelectedVariant){alert('Please choose the product options first.');return}
   const listingId=store==='renewed'&&ceroodSelectedOffer?String(ceroodSelectedOffer.seller_listing_id||''):'';
   sessionStorage.setItem(cfg.buy,JSON.stringify([{product_id:id,quantity:1,store:cfg.key,...(listingId?{seller_listing_id:listingId}:{}),...ceroodVariantPayload()}]));
   location.href=cfg.checkout;
 };
 // Renewed seller allocation is handled securely by the backend at checkout.
 ceroodRefreshPurchaseDisplay(p);
 loadRelated(p,store);
}
async function loadRelated(current,store){
 const cfg=STORES[store],section=$('relatedSection'),grid=$('relatedProducts');
 try{
   const r=await fetch(API_BASE+cfg.endpoint,{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error();
   const d=await r.json(),items=(Array.isArray(d.products)?d.products:[]).filter(p=>p&&String(p.id)!==String(current.id)&&p.status!=='draft').slice(0,5);
   if(!items.length){section.hidden=true;return}
   grid.innerHTML=items.map(p=>{const img=safeUrl(p.image_url||p.image),url=`/shop-product.html?store=${encodeURIComponent(store)}&id=${encodeURIComponent(p.id)}`;return `<article class="rn-related-card"><a class="rn-related-photo" href="${url}">${img?`<img loading="lazy" src="${esc(img)}" alt="${esc(p.name||'Product')}">`:'Product photo coming soon'}</a><div class="rn-related-name">${esc(p.name||'Product')}</div><div class="rn-related-price">₹${Number(p.price||0).toLocaleString('en-IN')}</div><a class="rn-related-link" href="${url}">View product →</a></article>`}).join('');section.hidden=false;
 }catch{section.hidden=true}
}
async function fetchOne(store,id){
 const cfg=STORES[store],r=await fetch(API_BASE+cfg.endpoint+'/'+encodeURIComponent(id),{headers:{Accept:'application/json'},cache:'no-store'});
 if(!r.ok)return null;const d=await r.json();const p=d.product||d.data||d;return p&&p.name?p:null;
}
async function init(){
 const q=new URLSearchParams(location.search),id=q.get('id');let store=(q.get('store')||q.get('marketplace')||q.get('division')||'').toLowerCase();store=aliases[store]||store;
 if(!id||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)){state('No product selected','Open a product from Cerood to see its details.');return}
 if(STORES[store]){try{const p=await fetchOne(store,id);if(p){render(p,store);return}}catch{}}
 for(const candidate of ['general','renewed','fashion','beauty']){
   if(candidate===store)continue;
   try{const p=await fetchOne(candidate,id);if(p){history.replaceState(null,'',`/shop-product.html?store=${candidate}&id=${encodeURIComponent(id)}`);render(p,candidate);return}}catch{}
 }
 state('Product not available','This product is not published or its store connection is unavailable.');
}
init();
})();
