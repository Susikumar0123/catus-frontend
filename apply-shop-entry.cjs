'use strict';
const fs=require('node:fs'),path=require('node:path');
function apply(root=process.cwd()){
 root=path.resolve(root);for(const file of ['shop.html','cerood-shop-entry.js'])if(!fs.existsSync(path.join(root,file)))throw Error('Copy frontend-root contents here first. Missing: '+file);
 if(!['index.html','home-services.html'].some(n=>fs.existsSync(path.join(root,n))))throw Error('Run this installer in the existing frontend repository root containing index.html or home-services.html.');
 const tag='<script id="cerood-shop-entry-link" src="/cerood-shop-entry.js?v=4" defer></script>',changes=[];
 for(const name of ['index.html','home-services.html']){const file=path.join(root,name);if(!fs.existsSync(file))continue;const original=fs.readFileSync(file,'utf8');if(/id=["']cerood-shop-entry-link["']/.test(original)||/src=["']\/?cerood-shop-entry\.js(?:\?[^"']*)?["']/.test(original))continue;if(!/<\/body\s*>/i.test(original))throw Error(name+' has no closing body tag; no files changed.');changes.push({file,name,original,updated:original.replace(/<\/body\s*>/i,tag+'\n</body>')})}
 if(!changes.length){console.log('No change needed: existing pages are already patched, or neither entry page exists.');return {changed:[]}}
 const backup=path.join(path.dirname(root),'cerood-frontend-backups',path.basename(root)+'-'+Date.now());fs.mkdirSync(backup,{recursive:true});for(const x of changes)fs.writeFileSync(path.join(backup,x.name),x.original);
 const written=[];try{for(const x of changes){fs.writeFileSync(x.file,x.updated);written.push(x)}}catch(e){for(const x of written)fs.writeFileSync(x.file,x.original);throw e}
 console.log('Added Shop navigation to: '+changes.map(x=>x.name).join(', '));console.log('Original page backup: '+backup);return {changed:changes.map(x=>x.name),backup};
}
if(require.main===module){try{apply()}catch(e){console.error(e.message);process.exitCode=1}}module.exports={apply};
