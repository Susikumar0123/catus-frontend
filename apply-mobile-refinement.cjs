const fs=require('fs'),path=require('path'),root=process.cwd();
for(const n of ['cerood-mobile-refinement.css','cerood-mobile-refinement.js'])if(!fs.existsSync(path.join(root,n)))throw Error('Copy '+n+' into catus-frontend first.');
const tag='<link rel="stylesheet" href="/cerood-mobile-refinement.css?v=1">\n<script defer src="/cerood-mobile-refinement.js?v=1"></script>';
const updates=['home-services.html','product.html'].map(name=>{const target=path.join(root,name),old=fs.readFileSync(target,'utf8');if(!old.includes('id="authModal"')||!old.includes('</head>'))throw Error('Expected page markup missing: '+name);return {name,target,old,next:old.includes(tag)?old:old.replace('</head>',tag+'\n</head>')};}).filter(x=>x.old!==x.next);
console.log('Update '+updates.length+' frontend pages; keep auth, gallery and booking logic unchanged.');
if(!process.argv.includes('--apply')){console.log('CHECK PASSED. Run: node apply-mobile-refinement.cjs --apply');process.exit(0);}
if(updates.length){const dir=path.join(path.dirname(root),'cerood-frontend-backups','mobile-refinement-'+Date.now());fs.mkdirSync(dir,{recursive:true});for(const x of updates){fs.writeFileSync(path.join(dir,x.name),x.old);fs.writeFileSync(x.target,x.next);}console.log('Complete. Backup: '+dir);}else console.log('Already applied.');
