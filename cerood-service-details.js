(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CeroodServiceDetails=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function model(s){
 const name=String(s.service_name||s.name||'').trim();if(!name)return null;
 const fan=/ceiling[ -]fan/i.test(name+' '+(s.slug||''));
 const note=String(s.product_note||'').trim();
 const points=String(s.why_choose_us||'').split('|').map(x=>x.trim()).filter(Boolean);
 const sections=[];
 if(note)sections.push({title:'Service information',text:note});
 if(points.length)sections.push({title:'Service highlights',items:points});
 sections.push({title:fan?'Ceiling fan repair: what to tell us':'Before your service visit',items:fan?['Tell us whether the fan does not start, runs slowly, makes noise, wobbles or has a regulator issue.','Share the fan brand, approximate age, ceiling height and when the issue began.','If there is sparking, a burning smell or a loose mounting, switch off the power and avoid using the fan until assessed.']:['Share the brand or model, the issue and when it started.','Confirm your service address, locality and preferred visit window.','Describe any access requirements before the visit.']});
 sections.push({title:'Inspection and work approval',text:fan?'Assessment may involve the supply, regulator, capacitor, wiring, bearings, motor or mounting, depending on the symptoms. The technician confirms the fault and proposed work before you approve repairs.':'The professional assesses your requirement and explains the proposed work. Confirm the scope and estimate before approving the service.'});
 sections.push({title:'Charges, parts and warranty',items:['Requesting a booking does not collect payment. This does not mean the visit or repair is free.','Confirm any visit or inspection fee before the appointment. Labour and spare parts may be quoted separately.','Confirm replacement-part choices and any applicable warranty terms before approving work.']});
 sections.push({title:'How booking works',items:['Choose a service option and preferred visit window, then send your booking request.','Cerood checks availability and confirms the appointment and any visit charge.','Review the assessment and estimate before approving work; check the completed work before payment.']});
 const faqs=fan?[
 ['Can a slow or noisy fan be repaired?','The cause needs assessment. A capacitor, regulator, bearing, wiring or motor issue can produce different symptoms; repair or replacement options depend on the fault.'],
 ['Are motor rewinding and spare parts included?','Do not assume these are included. Ask whether rewinding, replacement parts, removal and refitting are needed, and approve their charges first.'],
 ['Can I choose my visit time?','You can request a preferred window. Technician availability and the final appointment need confirmation.'],
 ['What warranty will I receive?','Ask for the specific warranty, covered work or parts and any exclusions in your estimate or invoice. No fixed warranty period is promised here.']
 ]:[['Is booking the same as a confirmed visit?','No. The requested visit window is subject to availability and confirmation.'],['Are parts and additional work included?','Confirm the scope, estimate and any separate parts or additional-work charges before approving.']];
 return {name,sections,faqs};
}
function html(s){const m=model(s);if(!m)return '';return `<div class="cerood-service-details-body"><style>#ceroodServiceDetails{display:block!important;margin:20px 0 0!important;padding:0!important;color:#243348;min-width:0}#ceroodServiceDetails h2{font-size:19px;line-height:1.35;margin:0 0 14px}#ceroodServiceDetails h3{font-size:14px;line-height:1.5;margin:0 0 7px}#ceroodServiceDetails .csd-section{padding:14px 0;border-top:1px solid #e6eaf0}#ceroodServiceDetails p,#ceroodServiceDetails li{font-size:13px;line-height:1.7;overflow-wrap:anywhere}#ceroodServiceDetails p{margin:0;white-space:pre-line}#ceroodServiceDetails ul{margin:0;padding-left:18px}#ceroodServiceDetails li+li{margin-top:5px}#ceroodServiceDetails details{border-top:1px solid #e6eaf0;padding:12px 0}#ceroodServiceDetails summary{cursor:pointer;font-size:13px;font-weight:600;line-height:1.6}#ceroodServiceDetails details p{margin-top:8px}@media(max-width:850px){#ceroodServiceDetails{margin-top:16px!important}#ceroodServiceDetails h2{font-size:18px}}</style><h2>About this service</h2>${m.sections.map(x=>`<section class="csd-section"><h3>${esc(x.title)}</h3>${x.text?`<p>${esc(x.text)}</p>`:`<ul>${x.items.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`}</section>`).join('')}<section class="csd-section"><h3>Frequently asked questions</h3>${m.faqs.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div>`;}
function render(s){
 if(typeof document==='undefined')return;
 let host=document.getElementById('ceroodServiceDetails');
 if(typeof window!=='undefined'&&window.CeroodServiceFamilies&&window.CeroodServiceFamilies.family(s)!=='home'){if(host)host.remove();return;}
 const parent=document.querySelector('#productGridMain .product-info');if(!parent)return;
 const content=html(s);if(!content){if(host)host.remove();return;}
 if(!host){host=document.createElement('section');host.id='ceroodServiceDetails';host.setAttribute('aria-label','Service details');parent.appendChild(host);}
 if(host.innerHTML!==content)host.innerHTML=content;
}
return {model,html,render};
});
