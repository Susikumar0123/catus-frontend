'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const handler=require('../api/local-discovery.js'),{rebase,mapData,sessionCookie,outgoingCookie,allowed}=handler._test;
const UP='https://cerood-local-discovery.susikumar.chatgpt.site';
function res(){return {headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},end(v){this.body=v;}}}
function req(p='',options={}){return {url:'/api/local-discovery?localPath='+encodeURIComponent(p),query:{localPath:p},method:'GET',headers:{},...options};}
(async()=>{
assert(allowed('/'));assert(!allowed('/api/admin'));assert(!allowed('//evil.com'));assert(!allowed('/api/launch-status'));
assert.equal(sessionCookie('secret=x; cerood_local_session='+'a'.repeat(43)+'; admin=true'),'cerood_local_session='+'a'.repeat(43));
assert.equal(outgoingCookie('other=x; Path=/'),null);
assert.equal(outgoingCookie('cerood_local_session=; Path=/; Max-Age=0'),'cerood_local_session=; Path=/local; Max-Age=0');
assert.equal(mapData({photos:'["/api/photos?id=x"]',about:'Meet at /api/photos?id=x'}).photos,'["/local/api/photos?id=x"]');
assert.deepEqual(mapData({photos:['/local/api/photos?id=x']},true),{photos:['/api/photos?id=x']});
assert.equal(rebase('<a href="/"><script src="/directory.js"></script><a href="/admin">'),'<a href="/local/"><script src="/local/directory.js"></script><a href="'+UP+'/admin">');
let calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({url:'/api/photos?id=x'}),{headers:{'Content-Type':'application/json','Set-Cookie':'cerood_local_session='+'a'.repeat(43)+'; Path=/; HttpOnly; Secure; SameSite=Lax'}});};
let r=res();await handler(req('api/local/auth/widget-login',{method:'POST',headers:{origin:'https://evil.com','content-type':'application/json'},body:{accessToken:'xxx'}}),r);assert.equal(r.statusCode,403);assert.equal(calls.length,0);
r=res();await handler(req('api/admin'),r);assert.equal(r.statusCode,404);assert.equal(calls.length,0);
r=res();await handler(req('api/directory',{method:'POST',headers:{origin:'https://www.cerood.com','content-type':'application/json','oai-authenticated-user-id':'forged',authorization:'forged',cookie:'admin=true; cerood_local_session='+'a'.repeat(43)},body:JSON.stringify({photos:['/local/api/photos?id=x']})}),r);
assert.equal(r.statusCode,200);assert.equal(calls[0].url,UP+'/api/directory');assert.equal(calls[0].options.headers.Origin,UP);assert.equal(calls[0].options.headers.authorization,undefined);assert.equal(calls[0].options.headers['oai-authenticated-user-id'],undefined);assert.equal(JSON.parse(calls[0].options.body).photos[0],'/api/photos?id=x');assert.equal(JSON.parse(r.body).url,'/local/api/photos?id=x');assert(r.headers['set-cookie'][0].includes('Path=/local;'));
// Raw Vercel body parsing (bodyParser disabled), upload binary and logout scoping.
r=res();let raw=req('api/local/auth/widget-login',{method:'POST',headers:{origin:'https://www.cerood.com','content-type':'application/json'}});raw[Symbol.asyncIterator]=async function*(){yield Buffer.from('{"accessToken":"verified-test"}')};await handler(raw,r);assert.equal(JSON.parse(calls.at(-1).options.body).accessToken,'verified-test');
r=res();await handler(req('api/photos',{method:'POST',headers:{origin:'https://www.cerood.com','content-type':'image/png'},body:Buffer.from([137,80,78,71])}),r);assert(Buffer.isBuffer(calls.at(-1).options.body));
r=res();await handler(req('../admin'),r);assert.equal(r.statusCode,400);
r=res();await handler(req('admin'),r);assert.equal(r.headers.location,UP+'/admin');
// Rebased shipped UI still parses; uploaded photo paths pass the rebased allowlist.
const source='/workspace/sites/cerood-local-directory';
if(fs.existsSync(source)){
for(const name of fs.readdirSync(source+'/public').filter(x=>x.endsWith('.js')&&!x.startsWith('admin'))){new vm.Script(rebase(fs.readFileSync(source+'/public/'+name,'utf8')),{filename:name});}
const context={window:{}};vm.runInNewContext(rebase(fs.readFileSync(source+'/public/business-profile.js','utf8')),context);assert.equal(context.window.CeroodBusinessProfile.photos(['/local/api/photos?id=x']).length,1);
for(const name of ['app/directory.html']){const html=rebase(fs.readFileSync(source+'/'+name,'utf8'));for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(m[1].trim())new vm.Script(m[1]);assert(!/\b(?:src|href)="\/(?!local\/|\/)/.test(html));}
}
// Installer preserves all unrelated production routes and backs up before changing.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cerood-local-path-'));fs.mkdirSync(temp+'/api');fs.writeFileSync(temp+'/api/local-discovery.js','');fs.writeFileSync(temp+'/home-services.html','');
const base={rewrites:[{source:'/:state/:district',destination:'/district.html'}],redirects:[{source:'/',destination:'/home-services.html',permanent:false}],headers:[{source:'/(.*)',headers:[]}]};fs.writeFileSync(temp+'/vercel.json',JSON.stringify(base));
const installer=path.resolve(__dirname,'../apply-local-path.cjs');cp.execFileSync(process.execPath,[installer],{cwd:temp});assert.deepEqual(JSON.parse(fs.readFileSync(temp+'/vercel.json')),base);cp.execFileSync(process.execPath,[installer,'--apply'],{cwd:temp});const config=JSON.parse(fs.readFileSync(temp+'/vercel.json'));assert.deepEqual(config.rewrites.slice(2),base.rewrites);assert.deepEqual(config.redirects,base.redirects);assert.deepEqual(config.headers,base.headers);const before=fs.readFileSync(temp+'/vercel.json','utf8');cp.execFileSync(process.execPath,[installer,'--apply'],{cwd:temp});assert.equal(fs.readFileSync(temp+'/vercel.json','utf8'),before);
console.log('PASS: scoped routes, rebased UI/photos, raw OTP body, cookie isolation, origin rejection, identity stripping, binary uploads, admin separation and installer preservation/idempotency. Mock upstream only; no OTP sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
