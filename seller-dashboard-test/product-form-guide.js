'use strict';
(()=>{
 function heading(text){const h=document.createElement('h2');h.className='field full entry-step';h.textContent=text;return h;}
 function arrange(){const form=document.querySelector('#catalogForm');if(!form)return;const grid=form.querySelector('.formgrid');if(!grid)return;
 grid.querySelectorAll('.entry-step').forEach(x=>x.remove());
 const category=form.querySelector('.category-picker');grid.append(heading('1. Choose a category'));if(category)grid.append(category);
 grid.append(heading('2. Product details'));
 for(const n of ['name','brand','model','description']){const label=form.querySelector('[name="'+n+'"]')?.closest('label');if(label)grid.append(label);}
 grid.append(heading('3. Price and stock'));
 for(const n of ['price','stock','compare_price']){const control=form.querySelector('[name="'+n+'"]');if(control)grid.append(control.closest('label'));}
 let hint=grid.querySelector('.price-entry-hint');if(!hint){hint=document.createElement('p');hint.className='field full muted price-entry-hint';}hint.textContent='One option: enter price and stock here. Multiple options: enter them in each option card below; totals update automatically.';grid.append(hint);
 const area=form.querySelector('#categoryFields');if(area){grid.append(heading('4. Specifications and category photos'));area.querySelectorAll(':scope > .field.full').forEach(node=>{if(node.querySelector('h2'))node.remove();});grid.append(area);}
 const variants=form.querySelector('#variantEditor');if(variants){grid.append(heading('5. Product options'));grid.append(variants);}
 grid.append(heading((variants?'6':'5')+'. Photos and video'));
 for(const selector of ['#photo','.seller-gallery','#productVideo']){const node=form.querySelector(selector);if(node)grid.append(selector==='.seller-gallery'?node:node.closest('label'));}
 // Named controls remain unchanged so existing validation and payloads still apply.
 for(const label of form.querySelectorAll('label.field')){label.querySelector(':scope > .entry-requirement')?.remove();if(label.hidden)continue;const controls=Array.from(label.querySelectorAll('input,select,textarea'));if(!controls.length)continue;
 let required=controls.some(c=>c.required||c.dataset.required==='true');if(controls.some(c=>c.id==='photo'))required=true;
 const badge=document.createElement('small');badge.className='entry-requirement';badge.textContent=controls.some(c=>c.readOnly)?'Calculated from options':required?'Required':'Optional';label.prepend(badge);}
 const submit=form.querySelector('#submitCatalog');if(submit)submit.textContent='Submit product for review';
 if(!form.querySelector('.entry-submit-note')){const note=document.createElement('p');note.className='entry-submit-note muted';note.textContent='Required fields must be completed. Your product appears in Shop after admin approval.';form.querySelector('.formactions')?.before(note);}
 }
 const oldCategory=categoryFields;categoryFields=function(...args){const r=oldCategory(...args);arrange();return r;};
 const old=views.add;views.add=async()=>{const v=await old();return {...v,bind(){v.bind();arrange();const form=document.querySelector('#catalogForm');for(const n of ['price','stock','compare_price'])form.querySelector('[name="'+n+'"]').addEventListener('input',syncVariantBase);form.addEventListener('click',e=>{if(e.target.closest('#addVariant,[data-remove-variant]'))arrange();});}};};
 const style=document.createElement('style');style.textContent='#catalogForm .entry-step{font-size:17px;margin:20px 0 4px;padding-top:16px;border-top:1px solid #e3e8e5}#catalogForm .entry-step:first-child{border:0;margin-top:0}#categoryFields,#variantEditor{grid-column:1/-1;width:100%;box-sizing:border-box}#variantEditor{margin:0}.option-cards{display:grid;gap:14px}.option-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;border:1px solid #dde5df;border-radius:12px;padding:16px;min-width:0}.option-card legend{font-size:14px;padding:0 6px}.entry-requirement{display:block;font-size:11px;color:#596e61;margin-bottom:4px}#catalogForm input[readonly]{background:#f3f5f3;color:#526256}#catalogForm input[type=number]{appearance:textfield;-moz-appearance:textfield}#catalogForm input::-webkit-inner-spin-button,#catalogForm input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.price-entry-hint{font-size:12px;line-height:1.5}@media(max-width:600px){.option-card{grid-template-columns:1fr}#catalogForm .formactions{flex-wrap:wrap}}';document.head.append(style);
})();
