'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
for(const name of ['store-product.html','store-checkout.html','store-orders.html','store-after-sales.html']){
 const text=read(name),ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,name+' duplicate IDs');
 assert.ok(text.includes('/cerood-store-pages.css?v=1'),name+' shared style');assert.ok(text.includes('/brand/logo.png'),name+' real brand');
 for(const m of text.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\/(?:[^"?]+))(?:\?[^"\s]*)?"/g))assert.ok(fs.existsSync(path.join(root,m[1])),name+' missing asset '+m[1]);
 for(const old of ['/shop-product.html','/shop-checkout.html','/cerood-orders.html'])assert.ok(!text.includes(old),name+' active old destination');
 assert.match(text,/<meta name="viewport"/);
}
for(const script of ['cerood-store-account.js','cerood-store-product.js','cerood-store-checkout.js','cerood-catalog.js','cerood-store-cart.js','cerood-account-push.js']){const r=spawnSync(process.execPath,['--check',path.join(root,script)]);assert.equal(r.status,0,script+' syntax: '+r.stderr)}
const product=read('store-product.html');for(const id of ['product','state','stateTitle','stateMessage','gallery','thumbs','name','price','stock','cart','buy','ceroodVariantOptions','productReviews','relatedProducts'])assert.ok(product.includes('id="'+id+'"'),'missing product '+id);
const checkout=read('store-checkout.html');for(const id of ['addressForm','savedAddress','place','checkDelivery','status','items','total','subtotal','delivery','onlinePayment','paymentAvailability','loginState'])assert.ok(checkout.includes('id="'+id+'"'),'missing checkout '+id);
assert.match(read('cerood-store-product.js'),/cerood_shop_cart/);assert.match(read('cerood-store-checkout.js'),/cerood_shop_buy_now/);assert.match(read('cerood-store-checkout.js'),/\/api\/shop\/verify-razorpay-payment/);
const routes={'shop-product.html':'store-product.html','shop-checkout.html':'store-checkout.html','cerood-orders.html':'store-orders.html','shop-after-sales.html':'store-after-sales.html','cerood-cart.html':'store-checkout.html'};
const config=JSON.parse(read('vercel.json'));
for(const [from,to]of Object.entries(routes)){
 const rule=config.redirects.find(x=>x.source==='/'+from);assert.ok(rule&&rule.destination.startsWith('/'+to),'missing compatibility redirect '+from);
 const code=read(from).match(/<script>(.*?)<\/script>/s)?.[1];assert.ok(code,from+' is not a redirect-only page');let destination;
 vm.runInNewContext(code,{URL,location:{origin:'https://www.cerood.com',search:'?id=abc&store=general',hash:'#orders',replace:url=>destination=url}});
 const out=new URL(destination);assert.equal(out.pathname,'/'+to);assert.equal(out.searchParams.get('id'),'abc');assert.equal(out.hash,'#orders');
}
assert.ok(config.rewrites.some(r=>r.source==='/local/:localPath*'),'Local route lost');
assert.match(read('cerood-catalog.js'),/\/store-product.html/);assert.match(read('cerood-store-cart.js'),/\/store-checkout.html/);assert.match(read('cerood-store-account.js'),/\/api\/shop\/customer-orders/);
console.log('PASS: new page assets/IDs, syntax, shared design, retained cart/payment contracts, new catalog destinations, exact old-link redirects with product/query/tab preservation and Local routes intact. No provider action.');
