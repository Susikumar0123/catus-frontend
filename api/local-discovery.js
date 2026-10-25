'use strict';
// Cerood Local gateway. The existing Sites app remains the data/auth authority.
const UPSTREAM = 'https://cerood-local-discovery.susikumar.chatgpt.site';
const PUBLIC = 'https://www.cerood.com';
const PREFIX = '/local';
const COOKIE = 'cerood_local_session';
const ASSETS = new Set(['directory.css','directory.js','business-profile.css','business-profile.js','local-form-options.css','local-form-options.js','local-transport.js','local-operations.js','widget-login.js','notifications.js','enquiry-thread.js','launch-ui.js','favicon.svg']);
function allowed(path) {
  return path === '/' || /^\/(help|contact|privacy|terms|robots\.txt|sitemap\.xml)$/.test(path) ||
    /^\/business\/[a-zA-Z0-9_-]{1,100}$/.test(path) || ASSETS.has(path.slice(1)) ||
    /^\/api\/(directory|photos|notifications)$/.test(path) ||
    /^\/api\/local\/auth\/(config|widget-login|me|logout)$/.test(path);
}
function photoPath(s, inward = false) {
  if (typeof s !== 'string') return s;
  return inward ? s.replace(/^\/local\/api\/photos(?=\?)/, '/api/photos') : s.replace(/^\/api\/photos(?=\?)/, '/local/api/photos');
}
function mapData(value, inward = false, key = '') {
  if (Array.isArray(value)) return value.map(v => mapData(v, inward, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,mapData(v,inward,k)]));
  if (key === 'photos' && typeof value === 'string') {
    if(value.startsWith('/api/photos?')||value.startsWith('/local/api/photos?'))return photoPath(value,inward);
    try { const a=JSON.parse(value); return Array.isArray(a)?JSON.stringify(a.map(s=>photoPath(s,inward))):value; } catch { return value; }
  }
  return ['photos','url'].includes(key) ? photoPath(value,inward) : value;
}
function rebase(text) {
  // Only known application paths; customer descriptions and third-party URLs remain untouched.
  text = text.replace(/https:\/\/(?:local\.cerood\.com|cerood-local-discovery\.susikumar\.chatgpt\.site)(?=[/"'\s<]|$)/g, PUBLIC+PREFIX);
  // Administration keeps the original ChatGPT owner authentication boundary.
  text = text.replace(/(["'`])\/(admin|signin-with-chatgpt|signout-with-chatgpt)(?=[/?#"'`])/g, '$1'+UPSTREAM+'/$2');
  text = text.replace(/(["'`])\/(?=(?:api\/|business\/|help\b|contact\b|privacy\b|terms\b|sitemap\.xml\b|robots\.txt\b|(?:directory|business-profile|local-form-options|local-transport|local-operations|widget-login|notifications|enquiry-thread|launch-ui|favicon)\.(?:js|css|svg)\b))/g, '$1'+PREFIX+'/');
  text = text.replace(/(["'`])\/(?=["'`?#])/g, '$1'+PREFIX+'/');
  // The photo allowlist uses an escaped regular expression, not a string URL.
  text = text.split('\\/api\\/photos').join('\\/local\\/api\\/photos');
  // Apply the shared interface only to Local HTML, never JSON/scripts/images.
  if (/<html[\s>]/i.test(text) && /<head[\s>]/i.test(text) && !text.includes('cerood-interface.css?v=1')) {
    text=text.replace(/<\/head>/i, '<link rel="stylesheet" href="/cerood-interface.css?v=1"><script defer src="/cerood-interface.js?v=1"></script></head>');
  }
  // Shared branding on Local HTML only.
  if (/<html[\s>]/i.test(text) && /<head[\s>]/i.test(text) && !text.includes('/cerood-brand.js?v=1')) text=text.replace(/<\/head>/i, '<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg?v=1"><link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png?v=1"><link rel="shortcut icon" href="/favicon.ico?v=1"><link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png?v=1"><link rel="stylesheet" href="/cerood-brand.css?v=1"><script defer src="/cerood-brand.js?v=1"></script></head>');
  return text;
}
function sessionCookie(header) {
  return (header||'').split(';').map(s=>s.trim()).find(s=>new RegExp('^'+COOKIE+'=[A-Za-z0-9_-]{43}$').test(s)) || '';
}
function outgoingCookie(value) {
  if (!new RegExp('^'+COOKIE+'=(?:[A-Za-z0-9_-]{43})?;').test(value)) return null;
  return value.replace(/;\s*Domain=[^;]+/ig,'').replace(/;\s*Path=[^;]+/i,'; Path=/local');
}
function fail(res,status,error) { res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error})); }
async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  try {
    let part=req.query?.localPath ?? '';
    if(Array.isArray(part)) part=part.join('/');
    if(typeof part!=='string'||part.length>256||/[\\%\x00-\x20?#]/.test(part)||part.split('/').some(s=>s==='.'||s==='..'))return fail(res,400,'Invalid Local path.');
    const path='/'+part.replace(/^\/+|\/+$/g,'');
    if(path==='/admin') {res.statusCode=302;res.setHeader('Location',UPSTREAM+'/admin');return res.end();}
    if(!allowed(path))return fail(res,404,'Local page not found.');
    const method=(req.method||'GET').toUpperCase();
    if(!['GET','HEAD','POST'].includes(method))return fail(res,405,'Method not allowed.');
    if(method==='POST'&&!path.startsWith('/api/'))return fail(res,405,'Method not allowed.');
    const origin=req.headers.origin;
    // External links may open public pages. Cross-site API/session requests
    // and every mutation still require the trusted browser origin.
    const crossSite=req.headers['sec-fetch-site']==='cross-site';
    if((origin&&origin!==PUBLIC)||(method==='POST'&&(origin!==PUBLIC||crossSite))||(path.startsWith('/api/')&&crossSite))return fail(res,403,'Cross-origin Local request rejected.');
    const query=new URL(req.url,'https://unused.invalid').searchParams;query.delete('localPath');
    const target=UPSTREAM+path+(query.size?'?'+query.toString():'');
    const headers={Accept:req.headers.accept||'*/*'};
    const cookie=sessionCookie(req.headers.cookie);if(cookie)headers.Cookie=cookie;
    // Do not forward browser identity, admin, host, authorization or forwarded headers.
    if(origin)headers.Origin=UPSTREAM;
    if(req.headers['x-cerood-local-client']==='web')headers['x-cerood-local-client']='web';
    let body;
    if(method==='POST') {
      const type=String(req.headers['content-type']||'');
      headers['Content-Type']=type;
      if(type.includes('application/json')) {
        if(req.body===undefined){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>256*1024)return fail(res,413,'Request too large.');chunks.push(chunk);}req.body=Buffer.concat(chunks);}
        const value=Buffer.isBuffer(req.body)?JSON.parse(req.body.toString()):typeof req.body==='string'?JSON.parse(req.body):req.body;
        body=JSON.stringify(mapData(value,true));
      } else if(path==='/api/photos'&&/^image\/(jpeg|png|webp)(?:;|$)/.test(type)) {
        if(Buffer.isBuffer(req.body))body=req.body;
        else {const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>4*1024*1024)return fail(res,413,'Use a photo smaller than 4 MB.');chunks.push(chunk);}body=Buffer.concat(chunks);}
      } else return fail(res,415,'Unsupported request format.');
      if(!body||Buffer.byteLength(body)>(path==='/api/photos'?4*1024*1024:256*1024))return fail(res,413,'Request too large.');
    }
    const response=await fetch(target,{method,headers,body,redirect:'manual',signal:AbortSignal.timeout(45000)});
    const location=response.headers.get('location');
    if(location) {const u=new URL(location,UPSTREAM);if(u.origin!==UPSTREAM)return fail(res,502,'Unexpected Local redirect.');res.setHeader('Location',u.pathname==='/admin'?UPSTREAM+'/admin':PREFIX+u.pathname+u.search+u.hash);}
    const cookies=(response.headers.getSetCookie?.()||[]).map(outgoingCookie).filter(Boolean);if(cookies.length)res.setHeader('Set-Cookie',cookies);
    const type=response.headers.get('content-type')||'application/octet-stream';res.setHeader('Content-Type',type);
    const robots=response.headers.get('x-robots-tag');if(robots)res.setHeader('X-Robots-Tag',robots);
    res.statusCode=response.status;
    if(method==='HEAD'||[204,304].includes(response.status))return res.end();
    if(type.includes('application/json')) {let data;try{data=await response.json();}catch{return fail(res,502,'Invalid Local response.');}return res.end(JSON.stringify(mapData(data)));}
    if(/(?:text\/html|javascript|text\/css|xml|text\/plain)/.test(type))return res.end(rebase(await response.text()));
    return res.end(Buffer.from(await response.arrayBuffer()));
  } catch(error) {return fail(res,error instanceof SyntaxError?400:502,error instanceof SyntaxError?'Invalid JSON request.':'Local service is temporarily unavailable. Please retry.');}
}
module.exports=handler;
module.exports._test={allowed,mapData,rebase,sessionCookie,outgoingCookie};
module.exports.config={api:{bodyParser:false}};
