'use strict';
// Local-only preview: files are never uploaded by this component.
const addWithLivePreview=views.add;
views.add=async()=>{const view=await addWithLivePreview();return {...view,bind(){
 view.bind();
 const form=$('#catalogForm'),saved=editing?.product_data||{},layout=document.createElement('div');layout.className='product-editor-layout';form.before(layout);layout.append(form);
 const preview=document.createElement('section');preview.className='seller-product-preview';preview.setAttribute('aria-label','Live product preview');layout.append(preview);
 const urls=new Map();let selected='',frame,expanded=null;
 const full=document.createElement('button');full.type='button';full.className='btn full-product-preview';full.textContent='Full preview ↗';layout.before(full);full.onclick=()=>{expanded?.remove();expanded=document.createElement('dialog');expanded.className='expanded-product-preview';expanded.innerHTML='<div class=modalhead><h2>Product preview</h2><button type=button class=icon aria-label=Close>×</button></div><div class=expanded-product-body></div>';document.body.append(expanded);expanded.querySelector('button').onclick=()=>expanded.close();expanded.addEventListener('close',()=>{expanded.remove();expanded=null;});render();expanded.showModal();};
 function localURL(file){if(!urls.has(file))urls.set(file,URL.createObjectURL(file));return urls.get(file);}
 function remote(url){try{return new URL(url).protocol==='https:'?url:'';}catch{return '';}}
 function render(){
  if(!form.isConnected)return;
  const f=new FormData(form),cat=categories.find(c=>String(c.id)===f.get('category_id'));
  const photos=[];
  const main=$('#photo')?.files[0],mainURL=main?.type.startsWith('image/')?localURL(main):remote(f.get('image_url'));
  if(mainURL)photos.push({url:mainURL,label:'Main product photo'});
  form.querySelectorAll('[data-slot-file]').forEach(input=>{const file=input.files[0],key=input.dataset.slotFile;const url=file?.type.startsWith('image/')?localURL(file):remote(f.get(key));if(url)photos.push({url,label:cat?.image_slots?.find(s=>'slot:'+s.slot_key===key)?.label||'Product photo'});});
  form.querySelectorAll('[data-slot-file]').forEach(input=>{let img=input.parentElement.querySelector('.slot-photo-preview');const file=input.files[0],url=file?.type.startsWith('image/')?localURL(file):remote(f.get(input.dataset.slotFile));if(url){if(!img){img=document.createElement('img');img.className='slot-photo-preview media-preview';img.alt='Selected category photo';input.after(img);}if(img.getAttribute('src')!==url)img.src=url;}else img?.remove();});
  const held=new Set([main,...Array.from(form.querySelectorAll('[data-slot-file]')).map(x=>x.files[0]),$('#productVideo')?.files[0]].filter(Boolean));
  for(const [file,url] of urls)if(!held.has(file)){URL.revokeObjectURL(url);urls.delete(file);}
  if(!photos.some(p=>p.url===selected))selected=photos[0]?.url||'';
  const title=f.get('name')||'Your product name',brand=f.get('brand')||'',price=f.get('price'),mrp=f.get('compare_price'),stock=f.get('stock'),description=f.get('description')||'Your product description will appear here.';
  const specs=(cat?.attributes||[]).filter(a=>a.is_variant!==true).map(a=>[a.label,String(f.get('attr:'+a.attribute_key)||''),a.unit]).filter(([,v])=>v.trim());
  const variantText=variantRows.map(v=>Object.entries(v.variant_values||{}).map(([k,val])=>{const a=variantFields.find(x=>x.attribute_key===k);return (a?.label||k)+': '+val;}).join(' · ')+(v.price?' · '+money(v.price):'')+(v.stock!==''&&v.stock!=null?' · '+v.stock+' units':'')).filter(Boolean);
  preview.innerHTML=`<div class="preview-title"><h2>Live product preview</h2><span>Updates as you type</span></div><p class="preview-disclaimer">Listing preview · final storefront styling may differ. This does not publish your product.</p><div class="preview-category">${esc($('#categoryPath').textContent||'Choose a category')}</div><div class="preview-photo">${selected?`<img src="${esc(selected)}" alt="${esc(title)}">`:'<span>Upload a photo to preview your product</span>'}</div><div class="preview-thumbnails">${photos.map((p,i)=>`<button type="button" data-preview-photo="${i}" aria-label="View ${esc(p.label)}" aria-pressed="${selected===p.url}"><img src="${esc(p.url)}" alt="${esc(p.label)}"></button>`).join('')}</div><p class="preview-brand">${esc(brand)}</p><h3>${esc(title)}</h3><div class="preview-pricing"><strong>${price!==''&&Number(price)>0?money(price):'₹ —'}</strong>${Number(mrp)>Number(price)&&Number(price)>0?`<del>${money(mrp)}</del><span>${Math.round((1-Number(price)/Number(mrp))*100)}% off</span>`:''}</div><p class="preview-stock">${stock===''?'Enter available stock':Number(stock)>0?esc(stock)+' units available':'Out of stock'}</p>${f.get('model')?`<p class="preview-model">Model: ${esc(f.get('model'))}</p>`:''}${variantText.length?`<h4>Product options</h4><div class="preview-options">${variantText.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}<h4>Description</h4><p class="preview-description">${esc(description)}</p>${specs.length?`<h4>Specifications</h4><dl>${specs.map(([k,v,u])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}${u?' '+esc(u):''}</dd></div>`).join('')}</dl>`:''}<div class="preview-video-note"></div>`;
  preview.querySelectorAll('[data-preview-photo]').forEach(b=>b.onclick=()=>{selected=photos[Number(b.dataset.previewPhoto)].url;render();});
  const video=$('#productVideo')?.files[0],videoURL=video&&['video/mp4','video/webm'].includes(video.type)?localURL(video):remote(f.get('video_url')||saved.video_url);
  if(videoURL){const video=document.createElement('video');video.controls=true;video.preload='metadata';video.src=videoURL;video.style.width='100%';preview.querySelector('.preview-video-note').append(video);}
  if(expanded){const body=expanded.querySelector('.expanded-product-body');body.innerHTML=preview.innerHTML;body.querySelectorAll('[data-preview-photo]').forEach(b=>b.onclick=()=>{selected=photos[Number(b.dataset.previewPhoto)].url;render();});}
 }
 const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(render);};
 form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('click',update);
 // Upload handlers can change hidden URL fields without firing input/change.
 const observer=new MutationObserver(update);observer.observe(form,{childList:true,subtree:true});
 const cleanup=new MutationObserver(()=>{if(!layout.isConnected){expanded?.close();observer.disconnect();cleanup.disconnect();cancelAnimationFrame(frame);for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();}});cleanup.observe($('#content'),{childList:true});
 render();
}};};
