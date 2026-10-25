'use strict';
const fs=require('node:fs'),path=require('node:path');
function apply(root=process.cwd()){
 root=path.resolve(root);
 for(const file of ['shop.html','cerood-shop-entry.js'])if(!fs.existsSync(path.join(root,file)))throw Error('Run inside catus-frontend. Missing: '+file);
 const tag='<script id="cerood-shop-entry-link" src="/cerood-shop-entry.js?v=4" defer></script>',changes=[];
 for(const name of ['index.html','home-services.html']){
  const file=path.join(root,name);if(!fs.existsSync(file))continue;
  const original=fs.readFileSync(file,'utf8');
  const clean=original.replace(/<script\b(?=[^>]*(?:\bid\s*=\s*["']cerood-shop-entry-link["']|\bsrc\s*=\s*["']\/?cerood-shop-entry\.js(?:\?[^"']*)?["']))[^>]*>\s*<\/script\s*>\r?\n?/gi,'');
  const bodies=[...clean.matchAll(/<\/body\s*>/gi)];if(!bodies.length)throw Error(name+' has no closing body; no files changed.');
  const at=bodies[bodies.length-1].index;
  const blocks=[...clean.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)];
  if(blocks.some(m=>m.index<at&&m.index+m[0].length>at))throw Error('Final body is inside a script in '+name+'; no files changed.');
  const nl=original.includes('\r\n')?'\r\n':'\n';
  const updated=clean.slice(0,at)+tag+nl+clean.slice(at);
  if(updated!==original)changes.push({name,file,original,updated});
 }
 if(!changes.length){console.log('Shop entry already correct. No files changed.');return {changed:[]};}
 const backup=path.join(path.dirname(root),'cerood-frontend-backups',path.basename(root)+'-shop-entry-repair-'+Date.now());fs.mkdirSync(backup,{recursive:true});
 for(const x of changes)fs.writeFileSync(path.join(backup,x.name),x.original);
 try{for(const x of changes)fs.writeFileSync(x.file,x.updated);}catch(e){for(const x of changes)fs.writeFileSync(x.file,x.original);throw e;}
 console.log('Repaired Shop script placement: '+changes.map(x=>x.name).join(', '));console.log('Backup: '+backup);return {changed:changes.map(x=>x.name),backup};
}
if(require.main===module){try{apply()}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={apply};
