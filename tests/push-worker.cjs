const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const listeners={},store=new Map(),shown=[],opened=[];
const indexedDB={open(){const r={result:{transaction(){const tx={};tx.objectStore=()=>({get(key){const req={};setTimeout(()=>{req.result=store.get(key);req.onsuccess?.();tx.oncomplete?.()},0);return req},put(value,key){store.set(key,value);const req={};setTimeout(()=>{req.result=value;req.onsuccess?.();tx.oncomplete?.()},0);return req}});return tx},close(){}}};setTimeout(()=>r.onsuccess?.(),0);return r}};
const self={location:{href:'https://www.cerood.com/cerood-account-push-worker.js',origin:'https://www.cerood.com'},addEventListener:(n,f)=>listeners[n]=f,skipWaiting:async()=>{},registration:{scope:'https://www.cerood.com/cerood-account-push/',getNotifications:async()=>[],showNotification:async(title,opts)=>shown.push({title,...opts})},clients:{claim:async()=>{},matchAll:async()=>[],openWindow:async url=>opened.push(url)}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cerood-account-push-worker.js'),'utf8'),{self,indexedDB,URL,console});
async function emit(type,data){let work;listeners[type]({...data,waitUntil:p=>work=p});await work}
(async()=>{
 await emit('message',{data:{type:'cerood-account-binding',binding:'account-a',scope:'shop'}});
 await emit('push',{data:{json:()=>({scope:'shop',binding:'account-a',title:'Order update',url:'/cerood-orders.html'})}});assert.equal(shown.length,1);
 await emit('message',{data:{type:'cerood-account-binding',binding:'account-b',scope:'shop'}});
 await emit('push',{data:{json:()=>({scope:'shop',binding:'account-a',title:'Old account message'})}});assert.equal(shown.length,1,'old account pushes must not display');
 await emit('push',{data:{json:()=>({scope:'local',binding:'account-b',title:'Wrong scope'})}});assert.equal(shown.length,1);
 await emit('push',{data:{json:()=>({scope:'shop',binding:'account-b',title:'New account update',url:'https://evil.test'})}});assert.equal(shown.length,2);assert.equal(shown[1].data.url,'https://www.cerood.com/cerood-orders.html');
 await emit('message',{data:{type:'cerood-account-binding',binding:'',scope:'shop'}});
 await emit('notificationclick',{notification:{data:shown[1].data,close(){}}});assert.equal(opened.length,0,'logged-out notifications must not open private pages');
 await emit('push',{data:{json:()=>({scope:'shop',binding:'account-b'})}});assert.equal(shown.length,2);
 console.log('PASS: worker persisted binding, account switch/logout privacy, scope separation, safe click destination and no stale-account notification opens. Mock service worker APIs only.');
})().catch(e=>{console.error(e);process.exitCode=1});
