
(()=>{'use strict';
const API=['localhost','127.0.0.1'].includes(location.hostname)?'http://localhost:3000':'https://catus-backend-d2js.onrender.com';
const $=id=>document.getElementById(id);
const q=new URLSearchParams(location.search),mode=q.get('mode')==='buy'?'buy':'cart';
const aliases={shop:'general',main:'general',clothing:'fashion',cosmetics:'beauty'};
let store=aliases[(q.get('store')||'general').toLowerCase()]||(q.get('store')||'general').toLowerCase();
const CFG={general:{label:'Shop',cart:'cerood_shop_cart',buy:'cerood_shop_buy_now',products:'/api/shop/products',quote:'/api/shop/quote',status:'/api/shop/checkout-status',cod:'/api/shop/place-cod-order',receipt:'cerood_shop_device_receipts',request:'cerood_shop_cod_request',online:true,prepare:'/api/shop/create-razorpay-order',verify:'/api/shop/verify-razorpay-payment'}};
if(!CFG[store])store='general';
const cfg=CFG[store];let productLoadVersion=0,deferredBagChange=false;let items=[],products=[],quote=null,codEnabled=false,onlineEnabled=false,busy=false,completed=false,quoteVersion=0,quoteAddress='';
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
function variantText(x){const v=x&&x.variant_values&&typeof x.variant_values==='object'?x.variant_values:{};return Object.entries(v).map(([k,val])=>String(k).replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase())+': '+(Array.isArray(val)?val.join(', '):val)).join(' · ')}
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
function token(){const a=localStorage.getItem('cerood_customer_session')||'',b=localStorage.getItem('cerood_renewed_customer_session')||'',t=a||b;if(t&&!a)localStorage.setItem('cerood_customer_session',t);if(t&&!b)localStorage.setItem('cerood_renewed_customer_session',t);return t}
async function json(path,opt={}){const h={Accept:'application/json',...(opt.headers||{})},t=token();if(t)h.Authorization='Bearer '+t;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);try{const r=await fetch(API+path,{cache:'no-store',...opt,headers:h,signal:controller.signal});let d={};try{d=await r.json()}catch{}if(t!==token())throw Error('Your account changed. Refresh checkout before continuing.');if(!r.ok||d.success===false)throw Error(d.message||'Checkout service unavailable.');return d}catch(e){if(e.name==='AbortError')throw Error('Server took too long. Retry; the same checkout request prevents duplicate orders.');throw e}finally{clearTimeout(timer)}}
function readItems(){try{
 // Renewed: seller_listing_id is intentionally optional. Missing ID lets the backend auto-allocate; an explicit customer choice is preserved.
 const raw=JSON.parse((mode==='buy'?sessionStorage.getItem(cfg.buy):localStorage.getItem(cfg.cart))||'[]'),m=new Map();
 if(!Array.isArray(raw))return[];
 for(const x of raw){
  const id=String(x?.product_id||''),n=Number(x?.quantity),listing=String(x?.seller_listing_id||'').trim(),variantId=String(x?.variant_id||'').trim(),variantSku=String(x?.variant_sku||x?.sku||'').trim();
  if(!/^[\w-]{1,100}$/.test(id)||!Number.isSafeInteger(n)||n<1)continue;
  if(listing&&!/^[0-9a-f-]{36}$/i.test(listing))continue;
  if(variantId&&!/^[0-9a-f-]{36}$/i.test(variantId))continue;
  const variantValues=x?.variant_values&&typeof x.variant_values==='object'&&!Array.isArray(x.variant_values)?x.variant_values:{};
  const key=id+'::'+listing+'::'+variantId+'::'+JSON.stringify(variantValues);
  const prev=m.get(key);
  m.set(key,{product_id:id,quantity:Math.min(store==='general'?10:99,(prev?.quantity||0)+n),...(listing?{seller_listing_id:listing}:{}),...(variantId?{variant_id:variantId}:{}),...(variantSku?{variant_sku:variantSku}:{}),...(Object.keys(variantValues).length?{variant_values:variantValues}:{})});
 }
 return [...m.values()].slice(0,20);
}catch{return[]}}
function address(){const f=$('addressForm'),x=Object.fromEntries(new FormData(f).entries());return {full_name:x.name.trim(),name:x.name.trim(),phone:x.phone.trim(),street:[x.house,x.street].filter(Boolean).join(', '),house:x.house.trim(),area:x.street.trim(),address_line1:x.house.trim(),address_line2:x.street.trim(),city:x.village.trim(),village:x.village.trim(),district:x.district.trim(),state:x.state.trim(),pincode:x.pincode.trim(),landmark:x.landmark.trim()}}
function valid(a){return a.full_name.length>=2&&/^[6-9]\d{9}$/.test(a.phone)&&a.house.length>=2&&a.city.length>=2&&a.district.length>=2&&a.state.length>=2&&/^[1-9]\d{5}$/.test(a.pincode)}
function payment(){return document.querySelector('input[name=paymentMode]:checked')?.value||'cod'}
function setStatus(s,err=false){$('status').className='status '+(err?'err':'');$('status').textContent=s}
function authState(){const t=token();$('loginState').innerHTML=t?'Signed in to your Cerood account. Order will appear in My Orders.':'Guest checkout. <button type="button" id="loginBtn" style="width:auto;margin:0 0 0 8px;padding:7px 10px">Login</button>';if(!t)$('loginBtn').onclick=()=>window.CeroodAuth?.open()}
async function saveAccountAddress(a){const t=token();if(!t)return;try{await fetch(API+'/api/customer/addresses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({full_name:a.full_name,phone:a.phone,address_line1:a.house,address_line2:a.area,landmark:a.landmark,city:a.city,district:a.district,state:a.state,pincode:a.pincode,address_type:'HOME'}),cache:'no-store'})}catch{}}
function prefill(){let loc=null;for(const k of ['cerood_checkout_address','cerood_selected_location','catus_user_location']){try{const x=JSON.parse(localStorage.getItem(k)||'null');if(x&&typeof x==='object'){loc=x;break}}catch{}}const f=$('addressForm');if(loc){const map={name:'name',full_name:'name',phone:'phone',house:'house',street:'street',area:'street',village:'village',city:'village',district:'district',state:'state',pincode:'pincode',landmark:'landmark'};for(const [k,n] of Object.entries(map))if(loc[k]&&f.elements[n]&&!f.elements[n].value)f.elements[n].value=loc[k]}try{const u=JSON.parse(localStorage.getItem('catus_logged_user')||'null');if(u){if(u.name)f.elements.name.value=u.name;if(u.phone)f.elements.phone.value=u.phone}}catch{}}
let savedAddresses=[];
async function loadSavedAddresses(){
 if(!token())return;
 try{const d=await json('/api/customer/addresses');savedAddresses=Array.isArray(d.addresses)?d.addresses:[];
  const select=$('savedAddress');select.replaceChildren(new Option('Choose a saved address',''));
  savedAddresses.forEach((a,i)=>select.add(new Option([a.full_name||a.name,a.address_line1,a.city,a.pincode].filter(Boolean).join(', '),String(i))));
  $('savedAddressLabel').hidden=!savedAddresses.length;
 }catch{ $('savedAddressLabel').hidden=true; }
}
$('savedAddress').onchange=()=>{
 const a=savedAddresses[Number($('savedAddress').value)];if($('savedAddress').value===''||!a)return;
 const f=$('addressForm');const values={name:a.full_name||a.name||'',phone:a.phone||'',house:a.address_line1||a.house||'',street:a.address_line2||a.area||'',village:a.city||a.village||'',district:a.district||'',state:a.state||'',pincode:a.pincode||'',landmark:a.landmark||''};
 for(const [key,value] of Object.entries(values))f.elements[key].value=value;
 quote=null;quoteAddress='';quoteVersion++;refresh();checkQuote();
};
async function loadStatus(){if(!cfg.status)return;try{const d=await json(cfg.status);if(store==='general'){codEnabled=d.cod_enabled===true;onlineEnabled=d.online_enabled===true}else if(store==='renewed'){const guest=d.guest_checkout_enabled===true;codEnabled=guest&&d.cod_enabled===true;onlineEnabled=guest&&d.payment_enabled===true&&d.reservations_enabled===true}else{codEnabled=!!d.cod_enabled;onlineEnabled=!!d.online_enabled}}catch{codEnabled=false;onlineEnabled=false}}
async function loadProducts(){
 const version=++productLoadVersion;
 if(store==='renewed'){
   const d=await json('/api/renewed/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});
   products=d.items||[];$('subtotal').textContent=money(d.subtotal);
 }else{
   if(store==='general'){const ids=[...new Set(items.map(x=>x.product_id))];const loaded=await Promise.all(ids.map(async id=>{const d=await json(cfg.products+'/'+encodeURIComponent(id));if(!d.product)throw Error('A selected product is unavailable.');return d.product}));if(version!==productLoadVersion)return;products=loaded}
   else{const d=await json(cfg.products),arr=d.products||d.items||[];products=arr.filter(p=>items.some(x=>String(x.product_id)===String(p.id)))}
 }
 let subtotal=0;$('items').innerHTML=items.map((x,i)=>{const p=(store==='renewed'&&products[i])||products.find(v=>String(v.id||v.product_id)===x.product_id)||{};const pv=window.CeroodShopModel.variant(p,x);const price=Number(pv?.price??p.price??p.unit_price??0),line=Number(p.line_total??price*x.quantity);subtotal+=line;const warranty=store==='renewed'&&Number(p.warranty_days)>0?' · '+Number(p.warranty_days)+' days warranty':'';const variant=variantText(x),sku=x.variant_sku||pv?.sku||'';const variantLine=variant?`<span style="display:block;color:#475569;margin-top:4px">${variant.replace(/[<>&"]/g,'')}${sku?' · SKU: '+String(sku).replace(/[<>&"]/g,''):''}</span>`:'';const photo=window.CeroodShopModel.image(p,location.origin),photoMarkup=photo?'<img class="checkout-item-image" src="'+photo.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'" alt="Product photo">':'';return `<div class="item">${photoMarkup}<div><strong>${String(p.name||'Product').replace(/[<>&"]/g,'')}</strong><span>${x.quantity} × ${money(price)}${warranty}</span>${variantLine}</div><b>${money(line)}</b></div>`}).join('');
 if(store!=='renewed')$('subtotal').textContent=money(subtotal);
 if(store==='general'){$('delivery').textContent='Check delivery address';$('total').textContent='—';quote=null}
}
async function checkQuote(){
 const version=++quoteVersion;quote=null;refresh();const a=address();if(!valid(a)){setStatus('Enter a complete delivery address, valid mobile number and PIN code.',true);return false}
 try{
   const body={address:a,items,payment_method:payment()};
   const result=await json(cfg.quote,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(version!==quoteVersion)return false;quote=result;quoteAddress=JSON.stringify(a);
   if(store==='general'&&Array.isArray(quote.items)){
     $('items').replaceChildren(...quote.items.map(x=>{
       const row=document.createElement('div');row.className='item';
       const detail=document.createElement('div'),title=document.createElement('strong'),info=document.createElement('span'),amount=document.createElement('b');
       title.textContent=x.name||'Product';info.textContent=x.quantity+' × '+money(x.unit_price)+(variantText(x)?' · '+variantText(x):'');amount.textContent=money(x.line_total);
       detail.append(title,info);const source=products.find(p=>String(p.id||p.product_id)===String(x.product_id||x.id)),photo=window.CeroodShopModel.image(source||x,location.origin);if(photo){const image=document.createElement('img');image.className='checkout-item-image';image.src=photo;image.alt=String(x.name||'Product');row.append(image)}row.append(detail,amount);return row;
     }));
   }
   $('subtotal').textContent=money(quote.subtotal);$('delivery').textContent=quote.delivery_fee==null?'—':money(quote.delivery_fee);$('total').textContent=quote.total==null?'—':money(quote.total);
   localStorage.setItem('cerood_selected_location',JSON.stringify({area:a.area,city:a.city,pincode:a.pincode,district:a.district,state:a.state}));
   localStorage.setItem('cerood_checkout_address',JSON.stringify({...a,street:a.area}));
   setStatus('Delivery and final price confirmed.');refresh();return quote.total!=null
 }catch(e){if(version!==quoteVersion)return false;quote=null;setStatus(e.message,true);refresh();return false}
}
function refresh(){
 const pm=payment(),available=pm==='cod'?codEnabled:onlineEnabled;
 $('onlinePayment').disabled=busy||!onlineEnabled;const cod=document.querySelector('input[name=paymentMode][value=cod]');if(cod)cod.disabled=busy||!codEnabled;
 $('paymentAvailability').textContent=onlineEnabled&&codEnabled?'COD and online payment are available for this store.':onlineEnabled?'Online payment is available. Cash on Delivery is currently unavailable here.':codEnabled?'Cash on Delivery is available. Online payment is currently unavailable here.':'Checkout is not enabled for this store.';
 $('place').disabled=completed||busy||!available||!items.length||!quote;
 if(completed){$('place').textContent='Order placed ✓';return}
 $('place').textContent=busy?'Please wait…':!available?'Payment method unavailable':pm==='cod'?'Place COD Order':'Continue to Secure Payment';
}
function saveReceipt(id,requestId,a){try{let r=JSON.parse(localStorage.getItem(cfg.receipt)||'[]');if(!Array.isArray(r))r=[];r=r.filter(x=>String(x.id)!==String(id));r.unshift({id,request_id:requestId,phone:a.phone});localStorage.setItem(cfg.receipt,JSON.stringify(r.slice(0,30)))}catch{}}
async function placeCod(){
 const a=address();if(!valid(a))throw Error('Complete your delivery address first.');
 if(!quote||quoteAddress!==JSON.stringify(a))throw Error('Save address & check delivery first.');
 let requestId=sessionStorage.getItem(cfg.request)||uuid();
 if(store==='general'){
   const fingerprint=JSON.stringify({address:a,items:items.map(x=>({product_id:x.product_id,variant_id:x.variant_id||null,quantity:x.quantity})).sort((x,y)=>(x.product_id+':'+(x.variant_id||'')).localeCompare(y.product_id+':'+(y.variant_id||'')))});
   const fingerprintKey=cfg.request+'_fingerprint',previous=sessionStorage.getItem(fingerprintKey);
   if(previous&&previous!==fingerprint)requestId=uuid();
   sessionStorage.setItem(fingerprintKey,fingerprint);
 }
 sessionStorage.setItem(cfg.request,requestId);
 const d=await json(cfg.cod,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id:requestId,address:a,items,...(store==='general'?{expected_total:quote.total}:{})})});
 const id=d.order_id||d.order?.id;if(!id)throw Error('Order ID missing from server response.');
 completed=true;saveReceipt(id,requestId,a);await saveAccountAddress(a);
 if(mode==='buy')sessionStorage.removeItem(cfg.buy);else{let current=[];try{current=JSON.parse(localStorage.getItem(cfg.cart)||'[]')}catch{}localStorage.setItem(cfg.cart,JSON.stringify(window.CeroodPaymentModel.subtractPurchased(current,items)))}sessionStorage.removeItem(cfg.request);
 setStatus('Order placed successfully. Order #'+String(id).slice(0,8).toUpperCase());$('place').textContent='Order placed ✓';$('place').disabled=true;
 setTimeout(()=>location.href='/store-orders.html#orders',900);
}
async function placeRenewedOnline(){
 const a=address();
 if(store!=='renewed'||!valid(a)||!quote)throw Error('Save a valid delivery address and check delivery first.');
 if(typeof Razorpay!=='function')throw Error('Razorpay checkout could not be loaded.');
 setStatus('Preparing secure payment…');
 const d=await json('/api/renewed/prepare-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:a,items})});
 if(!d.razorpay_order_id||!d.key_id||!d.amount)throw Error('Secure payment details are incomplete.');
 await new Promise((resolve,reject)=>{
  let done=false;
  const rzp=new Razorpay({
   key:d.key_id,amount:d.amount,currency:d.currency||'INR',name:'Cerood',
   description:'Cerood Renewed Order',order_id:d.razorpay_order_id,
   prefill:{name:a.full_name,contact:a.phone},theme:{color:'#244d38'},
   modal:{ondismiss:()=>{if(!done){done=true;reject(Error('Payment was cancelled.'))}}},
   handler:async r=>{
    if(done)return;
    try{
     const v=await json('/api/renewed/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      razorpay_order_id:r.razorpay_order_id,razorpay_payment_id:r.razorpay_payment_id,razorpay_signature:r.razorpay_signature
     })});
     if(!v.success)throw Error(v.message||'Payment verification is pending.');
     done=true;completed=true;saveReceipt(d.order_id,'ONLINE_'+(d.transaction_id||''),a);await saveAccountAddress(a);
     if(mode==='buy')sessionStorage.removeItem(cfg.buy);else localStorage.removeItem(cfg.cart);
     setStatus('Payment verified. Order placed successfully.');$('place').textContent='Payment successful ✓';$('place').disabled=true;
     setTimeout(()=>location.href='/store-orders.html#orders',900);resolve(v);
    }catch(e){done=true;reject(e)}
   }
  });
  rzp.on('payment.failed',r=>{if(!done){done=true;reject(Error(r?.error?.description||'Payment failed.'))}});
  rzp.open();
 });
}
async function placeCommonOnline(){
 const a=address();
 if(!cfg.prepare||!valid(a)||!quote||quoteAddress!==JSON.stringify(a))throw Error('Check your delivery address before payment.');
 if(typeof Razorpay!=='function')throw Error('Secure payment could not be loaded. Please retry.');
 if(store==='general'&&!token()){window.CeroodAuth?.open();throw Error('Sign in with your delivery mobile number before online payment.');}
 const paymentToken=token(),snapshot={address:a,items:JSON.parse(JSON.stringify(items)),quote:{...quote}};
 if(!crypto?.subtle?.digest)throw Error('Secure payments require HTTPS. Open the secure Cerood website.');
 let identity=paymentToken;if(store==='general'){const account=await json('/api/customer/profile');identity=String(account.user?.id||'');if(!/^[\w-]{1,100}$/.test(identity))throw Error('Your verified account could not be loaded. Sign in again before payment.')}
 const accountKey=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)).then(x=>Array.from(new Uint8Array(x),v=>v.toString(16).padStart(2,'0')).join(''));
 const key=cfg.request+'_online_'+accountKey,signatureKey=key+'_fingerprint',pendingKey=key+'_pending';
 const signature=window.CeroodPaymentModel.checkoutSignature(a,items,quote.total),fingerprint=signature;
 if(sessionStorage.getItem(key)&&sessionStorage.getItem(signatureKey)!==fingerprint){
   let prior;try{prior=JSON.parse(sessionStorage.getItem(pendingKey)||'null')}catch{}
   if(store==='general'&&prior?.order_id){const result=await json('/api/shop/recover-razorpay-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_id:prior.order_id})});if(result.paid){if(prior.mode==='cart'){let current=[];try{current=JSON.parse(localStorage.getItem(cfg.cart)||'[]')}catch{}localStorage.setItem(cfg.cart,JSON.stringify(window.CeroodPaymentModel.subtractPurchased(current,prior.items||[])))}sessionStorage.removeItem(key);sessionStorage.removeItem(signatureKey);sessionStorage.removeItem(pendingKey);throw Error('Your previous payment is confirmed. Refresh checkout to review your remaining cart before another purchase.')}}
   throw Error('An earlier payment checkout has different items or address. Check My Orders before starting another payment.');
 }
 const requestId=sessionStorage.getItem(key)||uuid();sessionStorage.setItem(key,requestId);sessionStorage.setItem(signatureKey,fingerprint);
 const d=await json(cfg.prepare,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(store==='general'?window.CeroodPaymentModel.payload(requestId,a,items,quote):{request_id:requestId,address:a,items})});
 if(store==='general')window.CeroodPaymentModel.prepared(d,snapshot.quote);if(d.order_id)sessionStorage.setItem(pendingKey,JSON.stringify({order_id:d.order_id,items:snapshot.items,mode}));
 async function finish(id){
   if(paymentToken!==token())throw Error('Your account changed. Sign in to the original account and check My Orders.');if(!id||String(id)!==String(d.order_id))throw Error('Order confirmation does not match this checkout. Check My Orders before paying again.');
   completed=true;saveReceipt(id,requestId,a);await saveAccountAddress(a);
   if(mode==='buy'){if(window.CeroodPaymentModel.checkoutSignature(a,readItems(),snapshot.quote.total)===signature)sessionStorage.removeItem(cfg.buy)}else{let current=[];try{current=JSON.parse(localStorage.getItem(cfg.cart)||'[]')}catch{}localStorage.setItem(cfg.cart,JSON.stringify(window.CeroodPaymentModel.subtractPurchased(current,snapshot.items)))}
   sessionStorage.removeItem(key);sessionStorage.removeItem(signatureKey);sessionStorage.removeItem(pendingKey);setStatus('Payment verified. Order placed successfully.');
   $('place').textContent='Payment successful ✓';$('place').disabled=true;
   setTimeout(()=>location.href='/store-orders.html#orders',900);
 }
 if(d.already_paid){await finish(d.order_id);return}
 if(!d.razorpay_order_id||!d.key_id||!d.amount)throw Error('Payment preparation incomplete. Retry this checkout.');
 // Retain the order receipt before opening payment, including if this tab closes.
 saveReceipt(d.order_id,requestId,a);
 await new Promise((resolve,reject)=>{
   let done=false;
   const checkout=new Razorpay({key:d.key_id,amount:d.amount,currency:d.currency||'INR',name:'Cerood',
     description:cfg.label+' order',order_id:d.razorpay_order_id,prefill:{name:a.full_name,contact:a.phone},theme:{color:'#244d38'},
     modal:{ondismiss:()=>{if(!done){done=true;reject(Error('Payment closed. Your checkout is saved; retry to continue.'))}}},
     handler:async result=>{if(done)return;done=true;try{if(result.razorpay_order_id!==d.razorpay_order_id)throw Error('Payment response belongs to a different order.');
       const verified=await json(cfg.verify,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
         razorpay_order_id:result.razorpay_order_id,razorpay_payment_id:result.razorpay_payment_id,razorpay_signature:result.razorpay_signature
       })});
       if(!verified.success)throw Error('Payment verification pending. Do not pay again.');
       await finish(verified.order_id||d.order_id);resolve(verified);
     }catch(error){reject(Error(error.message+' Check My Orders before paying again.'))}}
   });
   checkout.on('payment.failed',result=>{if(!done){done=true;reject(Error(result?.error?.description||'Payment failed. Retry this checkout.'))}});
   checkout.open();
 });
}
async function init(){
 $('checkoutTitle').textContent='Checkout.';$('storeNotice').textContent=`Review your items and confirm your delivery address to see the final total.`;
 items=readItems();authState();prefill();if(!items.length){$('items').innerHTML='<p>Your bag is empty.</p><a class="button secondary" href="/shop.html#catalog">Explore the collection ↗</a>';$('place').disabled=true;$('place').textContent='Add an item to continue';return}
 await Promise.all([loadStatus(),loadProducts(),loadSavedAddresses()]);refresh();
}
$('checkDelivery').onclick=checkQuote;
$('addressForm').addEventListener('submit',e=>{e.preventDefault();checkQuote()});
$('addressForm').addEventListener('input',()=>{quote=null;quoteAddress='';quoteVersion++;$('delivery').textContent='Check delivery address';$('total').textContent='—';refresh()});
for(const x of document.querySelectorAll('input[name=paymentMode]'))x.onchange=async()=>{if(busy)return;quote=null;quoteAddress='';quoteVersion++;if(valid(address()))await checkQuote();refresh()};
$('place').onclick=async()=>{if(busy)return;busy=true;document.querySelectorAll('#addressForm input').forEach(x=>x.readOnly=true);document.querySelectorAll('#savedAddress,input[name=paymentMode],#checkDelivery').forEach(x=>x.disabled=true);refresh();try{if(payment()==='online'){if(store==='renewed')await placeRenewedOnline();else await placeCommonOnline();return}await placeCod()}catch(e){setStatus(e.message,true)}finally{busy=false;document.querySelectorAll('#addressForm input').forEach(x=>x.readOnly=false);document.querySelectorAll('#savedAddress,input[name=paymentMode],#checkDelivery').forEach(x=>x.disabled=false);refresh();if(deferredBagChange&&!completed){deferredBagChange=false;bagChanged()}}};
function accountChanged(){quote=null;quoteAddress='';quoteVersion++;savedAddresses=[];$('savedAddress').replaceChildren();$('savedAddressLabel').hidden=true;$('delivery').textContent='Check delivery address';$('total').textContent='—';authState();refresh();if(token())loadSavedAddresses()}
async function bagChanged(){if(mode!=='cart'||completed)return;if(busy){deferredBagChange=true;return}items=readItems();quote=null;quoteAddress='';quoteVersion++;$('delivery').textContent='Check delivery address';$('total').textContent='—';refresh();if(!items.length){$('items').textContent='Your bag is empty.';return}try{await loadProducts();setStatus('Your bag changed. Check delivery & final total again.')}catch(e){setStatus(e.message,true)}}
window.addEventListener('cerood:bag-changed',bagChanged);window.addEventListener('storage',e=>{if(e.key===null||e.key===cfg.cart)bagChanged()});
window.addEventListener('cerood:login',accountChanged);window.addEventListener('cerood:logout',accountChanged);
init().catch(e=>setStatus(e.message,true));
})();
