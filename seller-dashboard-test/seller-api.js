(function(root){
'use strict';
class SellerAPI {
 constructor({fetcher=globalThis.fetch.bind(globalThis),storage=globalThis.sessionStorage,base=(root.location&&/^https?:$/.test(root.location.protocol)?root.location.origin:'https://catus-backend-d2js.onrender.com')}={}){this.fetcher=fetcher;this.storage=storage;this.base=base;this.seller=null;this.epoch=0;this.pendingMutations=new Set();}
 clear(){this.epoch++;this.storage.removeItem('ceroodSellerConnectedToken');this.seller=null;}
 request(path,options={}){const method=options.method||'GET';if(method==='GET')return this._request(path,options);const key=this.epoch+'|'+method+'|'+path;if(this.pendingMutations.has(key))return Promise.reject(Object.assign(Error('This action is still processing. Wait for its result before another attempt.'),{status:409,code:'ACTION_IN_FLIGHT'}));this.pendingMutations.add(key);return this._request(path,options).finally(()=>this.pendingMutations.delete(key));}
 async _request(path,{method='GET',body,auth=true}={}){
  if(!/^\/api\/sellers?\//.test(path))throw Error('Unsupported seller API route.');
  const token=this.storage.getItem('ceroodSellerConnectedToken');
  if(auth&&!token)throw Object.assign(Error('Sign in to your seller account.'),{status:401});
  const headers={};if(auth)headers.Authorization='Bearer '+token;
  const form=typeof FormData!=='undefined'&&body instanceof FormData;
  if(body!==undefined&&!form)headers['Content-Type']='application/json';
  let response;try{response=await this.fetcher(this.base+path,{method,headers,body:body===undefined?undefined:form?body:JSON.stringify(body),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(45000)});}catch(e){throw Error(e.name==='TimeoutError'?'The server took too long. Try again.':'Cannot reach the seller API. Check your connection and the backend CORS allowlist.');}
  if(auth&&token!==this.storage.getItem('ceroodSellerConnectedToken'))throw Object.assign(Error('Session changed. Reload this section.'),{status:409,code:'SESSION_CHANGED'});if(response.status===401&&auth)this.clear();
  let data;try{data=await response.json();}catch{throw Object.assign(Error(response.status===401?'Your session expired. Sign in again.':'The seller API returned an invalid response.'),{status:response.status,code:typeof data?.code==='string'?data.code:undefined});}
  if(!data||typeof data!=='object'||Array.isArray(data))throw Object.assign(Error('The seller API returned an invalid response.'),{status:response.status,code:typeof data?.code==='string'?data.code:undefined});
  if(!response.ok||data.success===false)throw Object.assign(Error(String(data.message||data.error||'Request failed.')),{status:response.status,code:typeof data?.code==='string'?data.code:undefined});
  return data;
 }
 async login(phone,password){this.clear();const epoch=this.epoch;const x=await this.request('/api/sellers/login',{method:'POST',body:{phone,password},auth:false});if(epoch!==this.epoch)throw Error('Sign-in was cancelled. Try again.');if(typeof x.token!=='string'||!x.token)throw Error('Login response did not contain a session.');this.storage.setItem('ceroodSellerConnectedToken',x.token);try{return await this.me();}catch(e){if(this.storage.getItem('ceroodSellerConnectedToken')===x.token)this.clear();throw e;}}
 async me(){const x=await this.request('/api/sellers/me');if(!x.seller?.id||x.seller.status!=='approved'){this.clear();throw Error('An approved seller account is required.');}this.seller=x.seller;return x.seller;}
 summary(){return this.request('/api/sellers/workspace/summary');}
 products(){return this.request('/api/sellers/catalog-submissions');}
 categories(){return this.request('/api/sellers/product-categories?marketplace=general');}
 submit(product,marketplace='general',id){if(marketplace!=='general')throw Error('Use the common product catalog.');return this.request('/api/sellers/catalog-submissions'+(id?'/'+encodeURIComponent(id):''),{method:id?'PATCH':'POST',body:{marketplace,product}});}
 inventory(){return this.request('/api/sellers/shop/inventory');}
 stock(row,stock){if(!Number.isSafeInteger(stock)||stock<0||stock>1000000)throw Error('Enter a valid whole stock quantity.');return this.request('/api/sellers/shop/inventory/'+encodeURIComponent(row.id),{method:'PATCH',body:{stock,expected_stock:Number(row.variant_id?row.variant_stock:row.stock),...(row.variant_id?{variant_id:row.variant_id}:{})}});}
 orders(){return this.request('/api/seller/orders');}
 order(id,status){if(!['accepted','rejected','packed','shipped'].includes(status))throw Error('Invalid order action.');const decision=['accepted','rejected'].includes(status);return this.request('/api/seller/orders/'+encodeURIComponent(id)+'/'+(decision?'decision':'fulfilment'),{method:'PATCH',body:decision?{decision:status}:{status}});}
 returns(){return this.request('/api/sellers/shop/returns');}
 review(id,decision,note){if(!['approve','reject'].includes(decision)||note.trim().length<10||note.length>1500)throw Error('Enter a review note of 10–1500 characters.');return this.request('/api/sellers/shop/returns/'+encodeURIComponent(id),{method:'PATCH',body:{decision,seller_note:note.trim()}});}
 settlements(page=1){return this.request('/api/sellers/shop/settlements?page='+page);}
 tickets(offset=0){return this.request('/api/sellers/support/tickets?offset='+offset+'&limit=50');}
 ticket(body){return this.request('/api/sellers/support/tickets',{method:'POST',body});}
 thread(id){return this.request('/api/sellers/support/tickets/'+encodeURIComponent(id));}
 reply(id,body){return this.request('/api/sellers/support/tickets/'+encodeURIComponent(id)+'/messages',{method:'POST',body:{body}});}
 async download(path){
  if(!/^\/api\/sellers?\//.test(path))throw Error('Unsupported seller API route.');const token=this.storage.getItem('ceroodSellerConnectedToken');if(!token)throw Object.assign(Error('Sign in to download.'),{status:401});
  const response=await this.fetcher(this.base+path,{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(45000)});
  if(token!==this.storage.getItem('ceroodSellerConnectedToken'))throw Object.assign(Error('Session changed. Reload this section.'),{status:409});if(response.status===401)this.clear();if(!response.ok){let x;try{x=await response.json();}catch{}throw Object.assign(Error(x?.message||'Download failed.'),{status:response.status,code:typeof x?.code==='string'?x.code:undefined});}return response.blob();
 }
 upload(file){const form=new FormData();form.append('file',file);return this.request('/api/sellers/upload-media',{method:'POST',body:form});}
}
root.SellerAPI=SellerAPI;if(typeof module!=='undefined')module.exports=SellerAPI;
})(typeof window!=='undefined'?window:globalThis);
