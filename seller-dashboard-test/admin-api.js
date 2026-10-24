(function(root){'use strict';
class CommerceAdminAPI{
 constructor({fetcher=globalThis.fetch.bind(globalThis),storage=globalThis.sessionStorage,base='https://catus-backend-d2js.onrender.com'}={}){this.fetcher=fetcher;this.storage=storage;this.base=base;this.epoch=0;this.pendingMutations=new Set();}
 token(){return this.storage.getItem('ceroodCommerceAdminSession');}
 clear(){this.epoch++;this.storage.removeItem('ceroodCommerceAdminSession');}
 request(path,options={}){const method=options.method||'GET';if(method==='GET')return this._request(path,options);const key=this.epoch+'|'+method+'|'+path;if(this.pendingMutations.has(key))return Promise.reject(Object.assign(Error('This action is still processing. Wait for its result before another attempt.'),{status:409,code:'ACTION_IN_FLIGHT'}));this.pendingMutations.add(key);return this._request(path,options).finally(()=>this.pendingMutations.delete(key));}
 async _request(path,{method='GET',body,auth=true}={}){
  if(!/^\/api\/admin\/(?:login|sellers(?:\/[^/?]+(?:\/status|\/details)?)?|catalog-submissions-all|catalog-submissions\/[^/?]+\/approval|seller-support\/tickets(?:\/[^/?]+(?:\/messages|\/status)?)?)(?:\?[^#]*)?$/.test(path)&&!((method==='GET'||method==='POST')&&path==='/api/admin/shop/categories')&&!(method==='PATCH'&&/^\/api\/admin\/shop\/categories\/[^/?]+$/.test(path))&&!root.CommerceManagement?.allowed(path,method))throw Error('Unsupported admin operation.');
  const token=this.token();if(auth&&!token)throw Object.assign(Error('Sign in as administrator.'),{status:401});const headers={};if(auth)headers.Authorization='Bearer '+token;if(body!==undefined)headers['Content-Type']='application/json';
  let r;try{r=await this.fetcher(this.base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(45000)});}catch{throw Error('Cannot reach the admin API. Check connection and the backend CORS allowlist.');}
  if(auth&&token!==this.token())throw Object.assign(Error('Admin session changed.'),{status:409});if(auth&&r.status===401)this.clear();let x;try{x=await r.json();}catch{throw Object.assign(Error('Invalid admin API response.'),{status:r.status});}if(!r.ok||x?.success===false)throw Object.assign(Error(String(x?.message||x?.error||'Admin request failed.')),{status:r.status,code:typeof x?.code==='string'?x.code:undefined});if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid admin API response.');return x;
 }
 async login(username,password){this.clear();const epoch=this.epoch,x=await this.request('/api/admin/login',{method:'POST',auth:false,body:{username,password}});if(epoch!==this.epoch)throw Error('Sign-in cancelled.');if(typeof x.token!=='string'||!x.token)throw Error('Missing admin session.');this.storage.setItem('ceroodCommerceAdminSession',x.token);try{return await this.sellers();}catch(e){if(this.token()===x.token)this.clear();throw e;}}
 async attachment(ticketId,attachmentId){
  const token=this.token();if(!token)throw Object.assign(Error('Sign in as administrator.'),{status:401});const path='/api/admin/seller-support/tickets/'+encodeURIComponent(ticketId)+'/attachments/'+encodeURIComponent(attachmentId);let r;try{r=await this.fetcher(this.base+path,{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(45000)});}catch{throw Error('Unable to download evidence.');}if(token!==this.token())throw Error('Admin session changed.');if(r.status===401)this.clear();if(!r.ok)throw Object.assign(Error('Evidence download failed.'),{status:r.status});return r.blob();
 }
 sellers(){return this.request('/api/admin/sellers');}
 products(){return this.request('/api/admin/catalog-submissions-all');}
 review(id,status,reason=''){if(!['approved','rejected'].includes(status))throw Error('Invalid review decision.');if(status==='rejected'&&(!reason.trim()||reason.length>500))throw Error('Choose a rejection reason (maximum 500 characters).');return this.request('/api/admin/catalog-submissions/'+encodeURIComponent(id)+'/approval',{method:'PATCH',body:{approval_status:status,rejection_reason:reason.trim()}});}
 sellerStatus(id,status){if(!['approved','rejected','suspended'].includes(status))throw Error('Invalid seller status.');return this.request('/api/admin/sellers/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:{status}});}
 tickets(offset=0){return this.request('/api/admin/seller-support/tickets?offset='+offset+'&limit=50');}
 thread(id){return this.request('/api/admin/seller-support/tickets/'+encodeURIComponent(id));}
 reply(id,body){if(!body.trim()||body.length>5000)throw Error('Enter a reply up to 5000 characters.');return this.request('/api/admin/seller-support/tickets/'+encodeURIComponent(id)+'/messages',{method:'POST',body:{body:body.trim()}});}
 ticketStatus(id,status){if(!['open','in_progress','needs_attention','closed'].includes(status))throw Error('Invalid ticket status.');return this.request('/api/admin/seller-support/tickets/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:{status}});}
}
root.CommerceAdminAPI=CommerceAdminAPI;if(typeof module!=='undefined')module.exports=CommerceAdminAPI;
})(typeof window!=='undefined'?window:globalThis);
