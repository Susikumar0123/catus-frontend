(function(root){'use strict';
class SellerDraftStore {
 constructor(storage,sellerId){if(!sellerId)throw Error('Sign in to use product drafts.');this.storage=storage;this.owner=String(sellerId);this.key='ceroodSellerDrafts:'+this.owner;}
 list(){let rows;try{rows=JSON.parse(this.storage.getItem(this.key)||'[]');}catch{throw Error('Saved drafts could not be read. Browser data has not been overwritten.');}if(!Array.isArray(rows))throw Error('Saved drafts are unavailable.');return rows.filter(r=>r&&r.owner_id===this.owner&&typeof r.id==='string'&&r.product&&typeof r.product==='object').sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));}
 save(draft){const rows=this.list(),entry={...draft,owner_id:this.owner,updated_at:new Date().toISOString()};if(!entry.id||!entry.product)throw Error('Invalid product draft.');const index=rows.findIndex(r=>r.id===entry.id);if(index>=0)rows[index]=entry;else{if(rows.length>=20)throw Error('You have 20 drafts. Delete or submit one before saving another.');rows.unshift(entry);}const text=JSON.stringify(rows);if(text.length>300000)throw Error('Draft storage limit reached. Shorten descriptions or remove older drafts.');try{this.storage.setItem(this.key,text);}catch{throw Error('Browser storage is full. The draft was not saved.');}return entry;}
 remove(id){const rows=this.list().filter(r=>r.id!==id);this.storage.setItem(this.key,JSON.stringify(rows));}
}
root.SellerDraftStore=SellerDraftStore;if(typeof module!=='undefined')module.exports=SellerDraftStore;
})(typeof window!=='undefined'?window:globalThis);
