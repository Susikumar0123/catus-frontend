'use strict';
// Run from the FRONTEND repository root. No dependencies required.
const fs = require('fs');
const path = require('path');
const target=path.resolve('vercel.json');
if(!fs.existsSync(target))throw Error('Run this script from the frontend folder containing vercel.json.');
const original=fs.readFileSync(target,'utf8');
const config=JSON.parse(original);
if(config.routes)throw Error('Legacy routes configuration found. Stop and send vercel.json for a compatible patch.');
if(config.rewrites && !Array.isArray(config.rewrites))throw Error('Non-array rewrites found. Send vercel.json for a compatible patch.');
const source='/:state(.*districtStateSlug.*)/:district(.*districtSlug.*)';
const rule={source,destination:'/api/invalid-seo-url'};
config.rewrites=[rule,...(config.rewrites||[]).filter(r=>r.source!==source)];
const backup=path.resolve('vercel.before-invalid-url-fix.json.bak');
if(!fs.existsSync(backup))fs.writeFileSync(backup,original,{flag:'wx'});
fs.writeFileSync(target,JSON.stringify(config,null,2)+'\n');
console.log('Updated vercel.json. Existing redirects, headers and rewrites preserved.');
console.log('Commit vercel.json and api/invalid-seo-url.js. Keep the backup locally.');
