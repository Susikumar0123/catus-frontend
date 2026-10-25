const fs=require('fs'),path=require('path'),root=process.cwd(),target=path.join(root,'product.html');
for(const n of ['cerood-service-panel.css','cerood-product-gallery.js'])if(!fs.existsSync(path.join(root,n)))throw Error('Copy '+n+' into catus-frontend first.');
const old=fs.readFileSync(target,'utf8');if(!old.includes('id="productGridMain"')||!old.includes('id="thumbnailContainer"')||!old.includes('</head>'))throw Error('Expected product gallery missing. No files changed.');
let next=old.replace(/<link rel="stylesheet" href="\/cerood-service-panel\.css\?v=\d+">\s*/g,'').replace(/<script defer src="\/cerood-product-gallery\.js\?v=\d+"><\/script>\s*/g,'');
next=next.replace('</head>','<link rel="stylesheet" href="/cerood-service-panel.css?v=2">\n<script defer src="/cerood-product-gallery.js?v=1"></script>\n</head>');
console.log(next===old?'Already applied.':'Update product.html gallery asset links only. Authentication, booking and service content preserved.');
if(!process.argv.includes('--apply')){console.log('CHECK PASSED. Run: node apply-product-gallery.cjs --apply');process.exit(0);}
if(next!==old){const dir=path.join(path.dirname(root),'cerood-frontend-backups','product-gallery-'+Date.now());fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'product.html'),old);fs.writeFileSync(target,next);console.log('Complete. Backup: '+dir);}
