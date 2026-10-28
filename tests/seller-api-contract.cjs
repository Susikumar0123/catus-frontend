'use strict';
// Offline Seller API regression checks. No live requests or customer data.
const assert=require('node:assert/strict');
const SellerAPI=require('../seller-dashboard-test/seller-api.js');
function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
async function run(){
 const calls=[], store=storage();store.setItem('ceroodSellerConnectedToken','local-test-token');
 const api=new SellerAPI({base:'https://example.invalid',storage:store,fetcher:async(url,opt)=>{calls.push({url,opt});return {ok:true,status:201,json:async()=>({success:true,url:'https://example.invalid/test.jpg'})};}});
 assert.throws(()=>api.upload({type:'image/jpeg',size:0}),/empty/);
 assert.throws(()=>api.upload({type:'image/gif',size:100}),/JPG/);
 assert.throws(()=>api.upload({type:'image/png',size:10*1024*1024+1}),/10 MB/);
 assert.throws(()=>api.upload({type:'video/mp4',size:25*1024*1024+1}),/25 MB/);
 assert.equal(calls.length,0,'invalid files must not trigger network requests');
 const file=new Blob(['test'],{type:'image/png'});
 await api.upload(file);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://example.invalid/api/sellers/upload-media');
 assert.equal(calls[0].opt.method,'POST');
 assert.equal(calls[0].opt.headers.Authorization,'Bearer local-test-token');
 assert.equal(calls[0].opt.headers['Content-Type'],undefined,'multipart boundary must be set by fetch');
 assert(calls[0].opt.body instanceof FormData);
 assert.equal(calls[0].opt.body.get('file').size,4);
 const failing=new SellerAPI({base:'https://example.invalid',storage:store,fetcher:async()=>({ok:false,status:403,json:async()=>({message:'Not allowed',code:'ACCESS_DENIED'})})});
 await assert.rejects(failing.download('/api/sellers/support/tickets/1/attachments/2'),e=>e.status===403&&e.code==='ACCESS_DENIED');
 console.log('PASS Seller API offline upload and download contracts (no network calls)');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
