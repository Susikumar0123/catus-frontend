const fs=require('fs'),path=require('path'),root=process.cwd(),file=path.join(root,'product.html');
const old=fs.readFileSync(file,'utf8');
if(!old.includes('id="productGridMain"')||!old.includes('</head>'))throw Error('Expected product page missing. No changes.');
if(!fs.existsSync(path.join(root,'cerood-service-panel.css')))throw Error('Copy cerood-service-panel.css into catus-frontend first.');
const tag='<link rel="stylesheet" href="/cerood-service-panel.css?v=1">';
const next=old.includes(tag)?old:old.replace('</head>',tag+'\n</head>');
console.log(next===old?'Already applied.':'Update product.html stylesheet link only; existing auth and booking code preserved.');
if(!process.argv.includes('--apply')){console.log('CHECK PASSED. Run: node apply-service-panel.cjs --apply');process.exit(0);}
if(next!==old){const dir=path.join(path.dirname(root),'cerood-frontend-backups','service-panel-'+Date.now());fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'product.html'),old);fs.writeFileSync(file,next);console.log('Complete. Backup: '+dir);}
