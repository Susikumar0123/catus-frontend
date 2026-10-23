(function(root){
'use strict';
class CategoryTree {
 constructor(rows=[]){
  this.nodes=new Map();this.groups=new Map();
  for(const row of rows){if(row.is_active===false||row.is_active==='false')continue;const id=String(row.id||'');if(!id)continue;if(this.nodes.has(id))throw Error('Category list needs attention. Contact support.');this.nodes.set(id,{...row,id,parent_id:row.parent_id==null?'':String(row.parent_id)});}
  // Only complete, active parent paths can be offered to the seller.
  for(const node of this.nodes.values()){if(!this.path(node.id))continue;const key=node.parent_id;const group=this.groups.get(key)||[];group.push(node);this.groups.set(key,group);}
  for(const group of this.groups.values())group.sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.name||a.slug).localeCompare(String(b.name||b.slug)));
 }
 path(id){const out=[],seen=new Set();let key=String(id||'');while(key){if(seen.has(key)||!this.nodes.has(key))return null;seen.add(key);const n=this.nodes.get(key);out.unshift(n);key=n.parent_id;}return out;}
 children(parent=''){return this.groups.get(String(parent))||[];}
 final(id){const n=this.nodes.get(String(id));return !!n&&!!this.path(id)&&!this.children(id).length&&(n.is_leaf===true||n.is_leaf==='true'||n.is_leaf===1);}
 choose(path,level,id){const next=path.slice(0,level),parent=next.at(-1)||'';if(id){if(!this.children(parent).some(n=>n.id===String(id)))throw Error('Choose a valid category.');next.push(String(id));}return next;}
}
const model={CategoryTree,
 orderTotals(rows=[]){return rows.reduce((out,row)=>{for(const key of ['new','accepted','packed','shipped','delivered'])out[key]+=Number(row[key]||0);return out;},{new:0,accepted:0,packed:0,shipped:0,delivered:0});},
 canEdit(product){return product.marketplace==='general'&&product.approval_status!=='withdrawn';}
};
root.CeroodCatalog=model;if(typeof module!=='undefined')module.exports=model;
})(typeof window!=='undefined'?window:globalThis);
