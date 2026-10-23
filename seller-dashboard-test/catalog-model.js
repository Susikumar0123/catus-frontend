(function(root){
'use strict';
const model={
 orderTotals(rows=[]){return rows.reduce((out,row)=>{for(const key of ['new','accepted','packed','shipped','delivered'])out[key]+=Number(row[key]||0);return out;},{new:0,accepted:0,packed:0,shipped:0,delivered:0});},
 canEdit(product){return product.marketplace==='general'&&product.approval_status!=='withdrawn';}
};
root.CeroodCatalog=model;if(typeof module!=='undefined')module.exports=model;
})(typeof window!=='undefined'?window:globalThis);
