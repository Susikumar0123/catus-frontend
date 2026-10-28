#!/usr/bin/env node
'use strict';
// Idempotent patch for the existing Cerood preview Worker.
// Run from a folder containing worker.mjs, seo-original-worker.mjs,
// cloudflare-api-gateway.mjs, wrangler.jsonc and dist/.
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const workerPath=path.join(root,'worker.mjs');
const gatewayPath=path.join(root,'cloudflare-api-gateway.mjs');
const seoPath=path.join(root,'seo-original-worker.mjs');
for(const p of [workerPath,gatewayPath,seoPath]){
 if(!fs.existsSync(p))throw Error('Required file missing: '+p);
}
const importLine="import { isGatewayRoute, proxyCeroodApi } from './cloudflare-api-gateway.mjs';";
const marker="    if (isPreviewAuth(url.pathname, method)) return previewAuthApi(request, url);";
const gatewayLine="    if (isGatewayRoute(url.pathname, method)) return proxyCeroodApi(request);";
let source=fs.readFileSync(workerPath,'utf8');
if(!source.includes("import { renderOriginalSeoPage }"))throw Error('Unexpected Worker version; inspect before patching');
if(!source.includes(marker))throw Error('Worker auth routing marker missing; inspect before patching');
if(!source.includes(importLine))source=importLine+'\n'+source;
if(!source.includes(gatewayLine))source=source.replace(marker,gatewayLine+'\n'+marker);
if(!source.includes(gatewayLine))throw Error('Failed to integrate gateway');
const backup=workerPath+'.before-gateway.bak';
if(!fs.existsSync(backup))fs.copyFileSync(workerPath,backup);
fs.writeFileSync(workerPath,source);
console.log('Gateway integrated into worker.mjs; original backup:',backup);
console.log('Next: node --check worker.mjs && npx wrangler deploy --dry-run');
console.log('Do not deploy until all routes and payment flows are reviewed.');
