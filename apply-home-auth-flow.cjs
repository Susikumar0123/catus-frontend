const fs=require('fs'),path=require('path');
const root=process.cwd(),apply=process.argv.includes('--apply');
const patches=[{"old": "    if (!name) {\n\n        alert('Please enter your full name.');\n\n        if (nameInput) {\n            nameInput.focus();\n        }\n\n        return;\n    }\n", "next": "    // Profile name is collected at booking; OTP registration does not require it."}, {"old": "    if (!/^\\d{6}$/.test(pincode)) {\n\n        alert('Please enter a valid 6-digit pincode.');\n\n        if (pincodeInput) {\n            pincodeInput.focus();\n        }\n\n        return;\n    }\n", "next": "    // Booking address collects the pincode; do not require it at signup."}];
const tag='<link rel="stylesheet" href="/cerood-home-auth.css?v=4">\n<script defer src="/cerood-home-auth.js?v=4"></script>';
const updates=[];
for(const name of ['home-services.html','product.html']){
 const target=path.join(root,name),old=fs.readFileSync(target,'utf8');let next=old;
 if(!old.includes('id="authModal"'))throw Error('Expected auth modal missing: '+name);
 for(const p of patches){if(next.includes(p.next))continue;if(next.split(p.old).length!==2)throw Error('Registration code differs: '+name+'. No changes applied.');next=next.replace(p.old,p.next);}
 if(name==='product.html'){const before="updateHeaderLoginUI();toggleAuthModal(false);\n   if(signedInAfterRegistration)openPremiumDashboard();\n   else if(window.CeroodAuth)window.CeroodAuth.open();",after="updateHeaderLoginUI();\n   if(signedInAfterRegistration && typeof window.CeroodFinishProfile==='function')window.CeroodFinishProfile();\n   else {toggleAuthModal(false);if(signedInAfterRegistration)openPremiumDashboard();else if(window.CeroodAuth)window.CeroodAuth.open();}";if(!next.includes(after)){if(next.split(before).length!==2)throw Error('Product registration completion differs.');next=next.replace(before,after);}}else{ if(!next.includes("updateHeaderLoginUI();if(typeof window.CeroodFinishProfile==='function'){window.CeroodFinishProfile();}else{toggleAuthModal(false);openPremiumDashboard();}showToast('Account created successfully!',false);")){const before="updateHeaderLoginUI();toggleAuthModal(false);openPremiumDashboard();showToast('Account created successfully!',false);";if(next.split(before).length!==2)throw Error('Registration completion differs: '+name);next=next.replace(before,"updateHeaderLoginUI();if(typeof window.CeroodFinishProfile==='function'){window.CeroodFinishProfile();}else{toggleAuthModal(false);openPremiumDashboard();}showToast('Account created successfully!',false);");}}

 next=next.replace(/<link rel="stylesheet" href="\/cerood-home-auth\.css\?v=\d+">\s*<script defer src="\/cerood-home-auth\.js\?v=\d+"><\/script>\s*/g,'');
 next=next.replace('</head>',tag+'\n</head>');
 if(next!==old)updates.push({target,name,old,next});
}
console.log('Update '+updates.length+' frontend pages. No OTP verification or session code changes.');
if(!apply){console.log('CHECK PASSED. Run: node apply-home-auth-flow.cjs --apply');process.exit(0);}
if(updates.length){const backup=path.join(path.dirname(root),'cerood-frontend-backups','auth-flow-'+Date.now());fs.mkdirSync(backup,{recursive:true});for(const x of updates){fs.writeFileSync(path.join(backup,x.name),x.old);fs.writeFileSync(x.target,x.next);}console.log('Complete. Backup: '+backup);}else console.log('Already applied.');
