/* Accessible password visibility controls; no authentication or stored values changed. */
(function(){'use strict';
function init(){const modal=document.getElementById('authModal');if(!modal)return;
function upgrade(){modal.querySelectorAll('.password-field-wrapper').forEach(wrapper=>{if(wrapper.querySelector('.cerood-password-toggle'))return;const input=wrapper.querySelector('input'),old=wrapper.querySelector('.toggle-password-icon');if(!input||!old)return;
const button=document.createElement('button');button.type='button';button.className='cerood-password-toggle';button.setAttribute('aria-controls',input.id);button.setAttribute('aria-label','Show password');button.setAttribute('aria-pressed','false');
const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
const eye=document.createElementNS(ns,'path');eye.setAttribute('d','M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z');const pupil=document.createElementNS(ns,'circle');pupil.setAttribute('cx','12');pupil.setAttribute('cy','12');pupil.setAttribute('r','3');const slash=document.createElementNS(ns,'path');slash.setAttribute('d','M3 3 21 21');slash.style.display='none';svg.append(eye,pupil,slash);button.append(svg);
button.addEventListener('pointerdown',e=>{e.preventDefault();});button.addEventListener('click',()=>{if(input.disabled)return;const visible=input.type==='password';input.type=visible?'text':'password';button.setAttribute('aria-label',visible?'Hide password':'Show password');button.setAttribute('aria-pressed',String(visible));slash.style.display=visible?'':'none';});old.replaceWith(button);
});}
upgrade();new MutationObserver(upgrade).observe(modal,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
