'use strict';
const fs=require('fs'),path=require('path');
const root=process.cwd(),file=path.join(root,'vercel.json');
if(!fs.existsSync(file)||!fs.existsSync(path.join(root,'home-services.html')))throw Error('Run inside catus-frontend, beside vercel.json and home-services.html.');
if(!fs.existsSync(path.join(root,'api','local-discovery.js')))throw Error('First copy the included api/local-discovery.js into catus-frontend/api/.');
const original=fs.readFileSync(file,'utf8'),config=JSON.parse(original);
if(config.routes)throw Error('Legacy routes config found. Stopped without changes; send vercel.json for review.');
if(config.rewrites&&!Array.isArray(config.rewrites))throw Error('Unsupported rewrites format. Stopped without changes.');
const rules=[{source:'/local',destination:'/api/local-discovery?localPath='},{source:'/local/:localPath*',destination:'/api/local-discovery?localPath=:localPath*'}];
const old=config.rewrites||[];
for(const rule of old){if(rule.source?.startsWith('/local')&&!rules.some(r=>r.source===rule.source&&r.destination===rule.destination))throw Error('An existing /local rule differs. Stopped without changes.');}
for(const rule of config.redirects||[]){if(rule.source==='/local'||rule.source?.startsWith('/local/'))throw Error('An existing Local redirect needs review. Stopped without changes.');}
config.rewrites=[...rules,...old.filter(r=>!rules.some(n=>n.source===r.source))];
const updated=JSON.stringify(config,null,2)+'\n';
if(updated===original){console.log('Already configured. No changes.');process.exit(0);}
if(!process.argv.includes('--apply')){console.log('CHECK PASSED. Existing Home Service/Shop routes preserved. Run: node apply-local-path.cjs --apply');process.exit(0);}
const backup=path.join(path.dirname(root),'cerood-frontend-backups','local-path-'+Date.now());
fs.mkdirSync(backup,{recursive:true});fs.writeFileSync(path.join(backup,'vercel.json'),original);
fs.writeFileSync(file,updated);console.log('Updated vercel.json. Backup: '+backup);console.log('No DNS, backend or database changes.');
