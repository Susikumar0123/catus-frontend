/* Shared presentation helpers. All order totals remain server-authoritative. */
(function(root){'use strict';
const rows=d=>Array.isArray(d)?d:[d?.products,d?.categories,d?.items,d?.data].find(Array.isArray)||[];
function safeURL(value,base='https://www.cerood.com/'){if(typeof value!=='string'||!value.trim())return '';try{const u=new URL(value,base);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
function image(p,base){const candidates=[p?.image_url,p?.image,p?.thumbnail_url,p?.primary_image_url];for(const arr of [p?.product_images,p?.images,p?.media]){if(Array.isArray(arr))candidates.push(...arr.map(x=>typeof x==='string'?x:x?.url||x?.image_url));else if(arr&&typeof arr==='object')for(const val of Object.values(arr))candidates.push(...(Array.isArray(val)?val:[val]).map(x=>typeof x==='string'?x:x?.url||x?.image_url))}return candidates.map(x=>safeURL(x,base)).find(x=>x&&!/\.(mp4|webm)(?:[?#]|$)/i.test(x))||''}
const variants=p=>Array.isArray(p?.variants)?p.variants:Array.isArray(p?.product_variants)?p.product_variants:[];
const variant=(p,x)=>variants(p).find(v=>String(v.id||v.variant_id)===String(x?.variant_id||''));
function descendants(cats,id){const set=new Set([String(id)]);for(let changed=true;changed;){changed=false;for(const c of cats)if(c.parent_id!=null&&set.has(String(c.parent_id))&&!set.has(String(c.id))){set.add(String(c.id));changed=true}}return set}
function categoryOptions(cats){const byId=new Map(cats.map(c=>[String(c.id),c])),out=[],seen=new Set();function visit(c,depth){const id=String(c.id);if(seen.has(id))return;seen.add(id);out.push({...c,depth});for(const child of cats)if(String(child.parent_id)===id)visit(child,depth+1)}for(const c of cats)if(!c.parent_id||!byId.has(String(c.parent_id)))visit(c,0);for(const c of cats)visit(c,0);return out}
function quantityLimit(p,x){const v=variant(p,x),counts=[p?.stock,v?.stock].filter(n=>n!=null&&Number.isFinite(Number(n))).map(n=>Math.max(0,Math.floor(Number(n))));return Math.min(10,...counts)}
const m={quantityLimit,rows,safeURL,image,variants,variant,descendants,categoryOptions};root.CeroodShopModel=m;if(typeof module!=='undefined')module.exports=m;
})(typeof window==='undefined'?globalThis:window);
