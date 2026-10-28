// Offline checks: no real backend requests, payments or customer data.
import assert from 'node:assert/strict';
import {isGatewayRoute,proxyCeroodApi} from '../cloudflare-api-gateway.mjs';
const origin='https://cerood-preview-test.susikumar0123.workers.dev';
assert(isGatewayRoute('/api/sellers/upload-media','POST'));
assert(isGatewayRoute('/api/shop/create-razorpay-order','POST'));
assert(isGatewayRoute('/api/shop/verify-razorpay-payment','POST'));
assert(isGatewayRoute('/api/customer/addresses','GET'));
assert(!isGatewayRoute('/api/shop/razorpay-webhook','POST'));
assert(!isGatewayRoute('/api/admin/sellers','GET'));
assert(!isGatewayRoute('/api/shop/quote','OPTIONS'));
let called=0;const oldFetch=globalThis.fetch;
globalThis.fetch=async (url,opts)=>{
 called++;
 assert.equal(url,'https://catus-backend-d2js.onrender.com/api/shop/quote?test=1');
 assert.equal(opts.method,'POST');
 assert.equal(opts.headers.get('Content-Type'),'application/json');
 assert.equal(opts.headers.get('Authorization'),'Bearer test-token');
 assert.equal(opts.body.byteLength,2);
 return new Response(JSON.stringify({success:true}),{status:200,headers:{'Content-Type':'application/json'}});
};
try {
 const request=new Request(origin+'/api/shop/quote?test=1',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer test-token','Origin':origin},body:'{}'});
 const response=await proxyCeroodApi(request);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 assert.deepEqual(await response.json(),{success:true});
 assert.equal(called,1);
 const cross=new Request(origin+'/api/shop/quote',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://evil.invalid'},body:'{}'});
 assert.equal((await proxyCeroodApi(cross)).status,403);
 assert.equal(called,1);
 const wrongType=new Request(origin+'/api/shop/quote',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});
 assert.equal((await proxyCeroodApi(wrongType)).status,415);
 assert.equal(called,1);
 const oversized=new Request(origin+'/api/shop/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(256*1024+1)});
 assert.equal((await proxyCeroodApi(oversized)).status,413);
 assert.equal(called,1);
 console.log('PASS Cloudflare gateway offline request validation and proxy contract');
}finally {globalThis.fetch=oldFetch;}
