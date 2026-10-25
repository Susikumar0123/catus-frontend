'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const root=process.cwd();
if(!fs.existsSync(path.join(root,'vercel.json'))||!fs.existsSync(path.join(root,'home-services.html')))throw Error('Run inside catus-frontend.');
for(const f of ['brand/logo.png','brand/logo-white.png','brand/favicon.svg','brand/favicon-32.png','brand/apple-touch-icon.png','brand/icon-192.png','brand/icon-512.png','brand/icon-maskable-192.png','brand/icon-maskable-512.png','favicon.ico','cerood-brand.js','cerood-brand.css'])if(!fs.existsSync(path.join(root,f)))throw Error('Copy ZIP contents first. Missing: '+f);
new vm.Script(fs.readFileSync(path.join(root,'cerood-brand.js'),'utf8'));
const block='<link rel="stylesheet" href="/cerood-brand.css?v=1"><script defer src="/cerood-brand.js?v=1"></script>';
const icons='<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg?v=1"><link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png?v=1"><link rel="shortcut icon" href="/favicon.ico?v=1"><link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png?v=1">';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.html')&&!/^(renewed|clothing|cosmetics)/.test(f));
const dir=path.join(root,'seller-dashboard-test');if(fs.existsSync(dir))for(const f of fs.readdirSync(dir))if(f.endsWith('.html'))files.push('seller-dashboard-test/'+f);
const plans=[];
for(const file of files){const old=fs.readFileSync(path.join(root,file),'utf8');if(!/<html[\s>]/i.test(old)||!/<body[\s>]/i.test(old)||old.includes('/cerood-brand.js?v=1'))continue;
 const end=old.toLowerCase().lastIndexOf('</body>');if(end<0)continue;
 // Insert before the actual final body, never inside an invoice/template script.
 let text=old.slice(0,end)+block+'\n'+old.slice(end);
 // Only alter real markup outside script/style blocks.
 text=text.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/gi).map((s,i)=>i%2?s:s.replace(/<link\b[^>]*>/gi,tag=>/\brel\s*=\s*["'](?:icon|shortcut icon|apple-touch-icon)["']/i.test(tag)?'':tag)).join('');
 if(/<\/head>/i.test(text))text=text.replace(/<\/head>/i,icons+'</head>');else text=text.replace(/<body\b/i,icons+'<body');
 plans.push({file,old,text});
}
const manifest='manifest.json';if(fs.existsSync(path.join(root,manifest))){const old=fs.readFileSync(path.join(root,manifest),'utf8'),value=JSON.parse(old);const desired=[...['192','512'].map(n=>({src:'/brand/icon-'+n+'.png',sizes:n+'x'+n,type:'image/png',purpose:'any'})),...['192','512'].map(n=>({src:'/brand/icon-maskable-'+n+'.png',sizes:n+'x'+n,type:'image/png',purpose:'maskable'}))];if(JSON.stringify(value.icons)!==JSON.stringify(desired)){value.icons=desired;plans.push({file:manifest,old,text:JSON.stringify(value,null,2)+'\n'});}}
const gateway='api/local-discovery.js';if(fs.existsSync(path.join(root,gateway))){const old=fs.readFileSync(path.join(root,gateway),'utf8');if(!old.includes('/cerood-brand.js?v=1')){const marker='  return text;\n}';if(old.split(marker).length!==2)throw Error('Local gateway version differs. Stopped without changes.');const addition="  // Shared branding on Local HTML only.\n  if (/<html[\\s>]/i.test(text) && /<head[\\s>]/i.test(text) && !text.includes('/cerood-brand.js?v=1')) text=text.replace(/<\\/head>/i, '"+icons+block+"</head>');\n";const text=old.replace(marker,addition+marker);new vm.Script(text);plans.push({file:gateway,old,text});}}
if(!plans.length){console.log('Already installed. No files changed.');process.exit(0);}
console.log('Update '+plans.length+' files. Preserve links, authentication, manifest identity and existing routes.');
if(!process.argv.includes('--apply')){console.log('CHECK PASSED. No changes. Run: node apply-cerood-logo.cjs --apply');process.exit(0);}
const backup=path.join(path.dirname(root),'cerood-frontend-backups','logo-'+Date.now());for(const p of plans){const dest=path.join(backup,p.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,p.old);}for(const p of plans)fs.writeFileSync(path.join(root,p.file),p.text);
console.log('Logo integration complete. Backup: '+backup);console.log('Changed: '+plans.map(p=>p.file).join(', '));
console.log('No backend/database changes. Review git status before staging.');
