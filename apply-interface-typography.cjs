'use strict';
const fs=require('fs'),path=require('path');
const root=process.cwd();
if(!fs.existsSync(path.join(root,'shop.html'))||!fs.existsSync(path.join(root,'vercel.json')))throw Error('Run inside catus-frontend.');
for(const file of ['cerood-interface.css','cerood-interface.js'])if(!fs.existsSync(path.join(root,file)))throw Error('Copy '+file+' to catus-frontend first.');
const css='<link rel="stylesheet" href="/cerood-interface.css?v=1">',js='<script defer src="/cerood-interface.js?v=1"></script>';
const targets=['shop.html','shop-product.html','shop-checkout.html','cerood-orders.html','cerood-cart.html','seller-join.html','seller-dashboard-test/connected.html','seller-dashboard-test/admin.html','seller-dashboard-test/index.html'];
let plans=[];
for(const file of targets){const p=path.join(root,file);if(!fs.existsSync(p))continue;let old=fs.readFileSync(p,'utf8'),text=old;if(text.includes('/cerood-interface.css?v=1'))continue;
 // Include scripts at the end so page-specific styles/scripts have loaded first.
 const end=text.toLowerCase().lastIndexOf('</body>');if(end<0)throw Error(file+': closing body missing. Stopped without changes.');
 text=text.slice(0,end)+css+js+'\n'+text.slice(end);plans.push({file,old,text});}
const gateway='api/local-discovery.js',p=path.join(root,gateway);
if(!fs.existsSync(p))throw Error('Local gateway missing. Stopped without changes.');
let old=fs.readFileSync(p,'utf8'),text=old;
if(!text.includes('cerood-interface.css?v=1')){
 const marker='  return text;\n}';
 if(text.split(marker).length!==2)throw Error('Local gateway version differs. Stopped without changes; send api/local-discovery.js.');
 text=text.replace(marker,`  // Apply the shared interface only to Local HTML, never JSON/scripts/images.\n  if (/<html[\\s>]/i.test(text) && /<head[\\s>]/i.test(text) && !text.includes('cerood-interface.css?v=1')) {\n    text=text.replace(/<\\/head>/i, '${css}${js}</head>');\n  }\n${marker}`);
 plans.push({file:gateway,old,text});
}
if(!plans.length){console.log('Already configured. No changes.');process.exit(0);}
console.log('Update '+plans.length+' existing files; shared typography for Shop, Seller and Local.');
if(!process.argv.includes('--apply')){console.log('CHECK PASSED. No files changed. Run: node apply-interface-typography.cjs --apply');process.exit(0);}
const backup=path.join(path.dirname(root),'cerood-frontend-backups','interface-type-'+Date.now());
for(const plan of plans){const dest=path.join(backup,plan.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,plan.old);}
for(const plan of plans)fs.writeFileSync(path.join(root,plan.file),plan.text);
console.log('Complete. Backup: '+backup);console.log('Changed: '+plans.map(x=>x.file).join(', '));console.log('Backend, database, authentication and product/customer values unchanged.');
