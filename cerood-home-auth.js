/* Presentation only: original Cerood login, registration and OTP handlers remain in charge. */
(function(){
 'use strict';
 const modal=document.getElementById('authModal');if(!modal)return;
 const phone=document.getElementById('inputPhone');
 const phoneStep=document.getElementById('authStepPhone');
 let usingPhone=false;
 const choose=document.createElement('button');choose.type='button';choose.className='cerood-auth-phone-method';choose.textContent='☎  Continue with phone';
 if(phone)phone.before(choose);
 const intro=phoneStep?.querySelector('p');
 function selectPhone(){usingPhone=true;update();phone?.focus();}
 choose.addEventListener('click',()=>{if(usingPhone){usingPhone=false;update();choose.focus();}else selectPhone();});
 phone?.addEventListener('focus',()=>{if(!usingPhone){usingPhone=true;update();}});
 const register=document.getElementById('authStepRegister');
 const password=document.getElementById('authStepNewPassword');
 function update(){
  const active=register&&getComputedStyle(register).display!=='none'?register:password&&getComputedStyle(password).display!=='none'?password:null;
  const next=active?'registration':'login';
  if(modal.dataset.ceroodAuthView!==next)modal.dataset.ceroodAuthView=next;
  if(phoneStep&&Array.from(phoneStep.querySelectorAll('button')).some(b=>b.textContent==='Cancel Google linking'&&!b.hidden))usingPhone=true;
  const selected=usingPhone?'true':'false';if(modal.dataset.ceroodPhoneSelected!==selected)modal.dataset.ceroodPhoneSelected=selected;
  const label=usingPhone?'← Other login methods':'☎  Continue with phone';if(choose.textContent!==label)choose.textContent=label;
  const heading=phoneStep?.querySelector('h3');if(heading&&heading.textContent!=='Log in or sign up')heading.textContent='Log in or sign up';
  const copy=usingPhone?'Enter your mobile number to continue.':'Sign in to book services and manage your bookings.';
  if(intro&&intro.textContent!==copy)intro.textContent=copy;
  modal.querySelectorAll('.auth-primary-btn').forEach(b=>{const labels={'CONTINUE':'Continue','LOGIN':'Log in','GET OTP & REGISTER':'Continue'};const label=labels[b.textContent.trim()];if(label)b.textContent=label;});
 }
 const title=register?.querySelector('h3');if(title)title.textContent='Create your account';
 if(register&&!register.querySelector('.cerood-auth-legal')){const legal=document.createElement('p');legal.className='auth-terms-text cerood-auth-legal';const terms=document.createElement('a');terms.href='/terms.html';terms.textContent='Terms of use';const privacy=document.createElement('a');privacy.href='/privacy-policy.html';privacy.textContent='Privacy policy';legal.append(terms,document.createTextNode('  |  '),privacy);register.append(legal);}
 const phoneTitle=document.querySelector('#authStepPhone h3');if(phoneTitle)phoneTitle.textContent='Log in or sign up';
 const email=document.getElementById('regEmail');if(email)email.placeholder='Email address (optional)';
 new MutationObserver(update).observe(modal,{attributes:true,attributeFilter:['style','class','hidden'],subtree:true});
 update();
})();
