// Cloudflare API gateway helper for the Cerood migration.
// Import in worker.mjs and call before generic /api GET routing.
// Do NOT route payment webhooks through the frontend worker: Render must receive them directly.
const BACKEND = 'https://catus-backend-d2js.onrender.com';
const sellerRoute = /^\/api\/sellers?\/[a-zA-Z0-9/_-]+$/;
const shopRoute = /^\/api\/(?:shop|customer|renewed)\/[a-zA-Z0-9/_-]+$/;
const excluded = /^\/api\/(?:shop\/razorpay-webhook|admin\/|sellers?\/.*\/webhook)/;
export function isGatewayRoute(path, method) {
  return ['GET','HEAD','POST','PATCH','PUT','DELETE'].includes(method) &&
    (sellerRoute.test(path) || shopRoute.test(path)) && !excluded.test(path);
}
export async function proxyCeroodApi(request) {
  const url = new URL(request.url), method=request.method.toUpperCase();
  if (!isGatewayRoute(url.pathname, method)) return null;
  const origin=request.headers.get('Origin');
  if (origin && origin!==url.origin) return new Response('Origin rejected',{status:403});
  if (request.headers.get('Sec-Fetch-Site')==='cross-site') return new Response('Cross-site request rejected',{status:403});
  const headers=new Headers({Accept:request.headers.get('Accept')||'application/json'});
  const auth=request.headers.get('Authorization');
  if (auth && /^Bearer [A-Za-z0-9._~-]{1,4096}$/.test(auth)) headers.set('Authorization',auth);
  const contentType=request.headers.get('Content-Type')||'';
  const hasBody=!['GET','HEAD'].includes(method);
  let body;
  if (hasBody) {
    const upload=url.pathname==='/api/sellers/upload-media';
    if (upload ? !/^multipart\/form-data;\s*boundary=/i.test(contentType) : !/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
      return new Response('Unsupported content type',{status:415});
    }
    const max=upload?26*1024*1024:256*1024;
    const length=Number(request.headers.get('Content-Length'));
    if (Number.isFinite(length)&&length>max) return new Response('Request too large',{status:413});
    body=await request.arrayBuffer();
    if(body.byteLength>max) return new Response('Request too large',{status:413});
    headers.set('Content-Type',contentType);
  }
  try {
    const upstream=await fetch(BACKEND+url.pathname+url.search,{method,headers,body,redirect:'manual'});
    if (upstream.status>=300&&upstream.status<400) return new Response('Unexpected API redirect',{status:502});
    const out=new Headers({'Content-Type':upstream.headers.get('Content-Type')||'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'});
    if (method==='HEAD'||upstream.status===204||upstream.status===304) return new Response(null,{status:upstream.status,headers:out});
    return new Response(upstream.body,{status:upstream.status,headers:out});
  } catch {
    return new Response(JSON.stringify({success:false,message:'Backend temporarily unavailable'}),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
}
