'use strict';
const fs=require('fs'),path=require('path');
const root=process.cwd(),file=path.join(root,'vercel.json');
if(!fs.existsSync(file)||!fs.existsSync(path.join(root,'api','local-discovery.js')))throw Error('Run inside catus-frontend after installing the Local integration.');
const old=fs.readFileSync(file,'utf8'),config=JSON.parse(old);
if(!Array.isArray(config.rewrites)||config.routes)throw Error('Unsupported routing config. Stopped without changes.');
const rule={source:'/local/',destination:'/api/local-discovery?localPath='};
const existing=config.rewrites.find(r=>r.source===rule.source);
if(existing&&existing.destination!==rule.destination)throw Error('A different /local/ rule exists. Stopped without changes.');
if(existing){console.log('Already fixed. No changes.');process.exit(0);}
if(!config.rewrites.some(r=>r.source==='/local'&&r.destination==='/api/local-discovery?localPath='))throw Error('Expected working /local rule not found. Stopped without changes.');
if(!process.argv.includes('--apply')){console.log('CHECK PASSED. Add explicit /local/ route only. Run: node apply-local-slash-fix.cjs --apply');process.exit(0);}
const backup=path.join(path.dirname(root),'cerood-frontend-backups','local-slash-'+Date.now());fs.mkdirSync(backup,{recursive:true});fs.writeFileSync(path.join(backup,'vercel.json'),old);
config.rewrites.unshift(rule);fs.writeFileSync(file,JSON.stringify(config,null,2)+'\n');console.log('Fixed /local/ route. Backup: '+backup);console.log('Other routes, API files, backend and database unchanged.');
