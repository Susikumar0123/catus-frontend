/* Cerood mobile -> password -> verified OTP. No provider verification is bypassed. */
(function(){
'use strict';
const modal=document.getElementById('authModal'),phone=document.getElementById('inputPhone'),reg=document.getElementById('authStepRegister');
if(!modal||!phone||!reg)return;
const input=document.getElementById('regMobile'),pass=document.getElementById('regPassword'),confirm=document.getElementById('regConfirmPassword');
const heading=reg.querySelector('h3');if(heading)heading.textContent='Create a password';
const desc=reg.querySelector('p');if(desc)desc.textContent='Use this password to log in to your Cerood account.';
const summary=document.createElement('div');summary.className='cerood-auth-number-summary';
const number=document.createElement('span'),edit=document.createElement('button');edit.type='button';edit.textContent='Edit';edit.addEventListener('click',()=>{if(typeof backToPhoneStep==='function')backToPhoneStep();phone.focus();});
summary.append(number,edit);pass.parentElement.before(summary);
const legal=document.createElement('p');legal.className='auth-terms-text';const terms=document.createElement('a'),privacy=document.createElement('a');terms.href='/terms.html';terms.textContent='Terms of use';privacy.href='/privacy-policy.html';privacy.textContent='Privacy policy';legal.append(terms,document.createTextNode('  |  '),privacy);reg.append(legal);
function syncPassword(){if(confirm)confirm.value=pass.value;}
pass.addEventListener('input',syncPassword);
reg.addEventListener('click',e=>{if(e.target.closest('.auth-primary-btn'))syncPassword();},true);
const profile=document.createElement('div');profile.id='ceroodAuthProfile';profile.style.display='none';profile.className='cerood-auth-profile';
const title=document.createElement('h3');title.textContent='Your details';
const description=document.createElement('p');description.textContent='Add your name and email, or skip for now.';
const form=document.createElement('form');
const nameLabel=document.createElement('label');nameLabel.textContent='Name (optional)';nameLabel.htmlFor='ceroodProfileName';
const nameField=document.createElement('input');nameField.id='ceroodProfileName';nameField.name='name';nameField.autocomplete='name';nameField.maxLength=160;nameField.placeholder='Your name';nameField.className='auth-input-field';
const emailLabel=document.createElement('label');emailLabel.textContent='Email address (optional)';emailLabel.htmlFor='ceroodProfileEmail';
const emailField=document.createElement('input');emailField.id='ceroodProfileEmail';emailField.name='email';emailField.type='email';emailField.autocomplete='email';emailField.maxLength=320;emailField.placeholder='Email address';emailField.className='auth-input-field';
const error=document.createElement('p');error.setAttribute('role','alert');error.className='cerood-profile-error';
const save=document.createElement('button');save.type='submit';save.textContent='Continue';save.className='auth-primary-btn';
const skip=document.createElement('button');skip.type='button';skip.textContent='Skip for now';skip.className='cerood-profile-skip';
form.append(nameLabel,nameField,emailLabel,emailField,error,save,skip);profile.append(title,description,form);modal.querySelector('.auth-right-panel').append(profile);
const previousStep=window.showAuthStep;
if(typeof previousStep==='function')window.showAuthStep=function(...args){profile.style.display='none';return previousStep.apply(this,args);};
function finish(){profile.style.display='none';if(typeof updateHeaderLoginUI==='function')updateHeaderLoginUI();if(typeof toggleAuthModal==='function')toggleAuthModal(false);if(typeof openPremiumDashboard==='function')openPremiumDashboard();}
skip.addEventListener('click',finish);
window.CeroodFinishProfile=function(){
 if(!localStorage.getItem('cerood_home_service_session')){finish();return;}
 modal.querySelectorAll('[id^="authStep"]').forEach(e=>e.style.display='none');
 let user={};try{user=JSON.parse(localStorage.getItem('cerood_home_service_user')||'{}');}catch{}
 nameField.value=user.name||'';emailField.value=user.email||'';error.textContent='';profile.style.display='flex';update();nameField.focus();
};
form.addEventListener('submit',async e=>{
 e.preventDefault();if(save.disabled)return;if(!form.reportValidity())return;
 const name=nameField.value.trim(),email=emailField.value.trim();if(!name&&!email){finish();return;}
 save.disabled=true;skip.disabled=true;error.textContent='';
 try{
 const token=localStorage.getItem('cerood_home_service_session');if(!token)throw Error('Please log in again.');
 const r=await fetch('https://catus-backend-d2js.onrender.com/api/home-services/customer/update-profile',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({name,email})});
 const d=await r.json();if(!r.ok||!d.success||!d.user)throw Error(d.message||'Could not save your profile. Please try again.');
 localStorage.setItem('cerood_home_service_user',JSON.stringify(d.user));
 if(typeof currentUser!=='undefined')currentUser=d.user;
 finish();
 }catch(err){error.textContent=err.message||'Could not save your profile.';}finally{save.disabled=false;skip.disabled=false;}
});

let lastStep='';
function update(){
const isRegister=getComputedStyle(reg).display!=='none';
const otp=document.getElementById('authStepOTP'),reset=document.getElementById('authStepNewPassword');
const isOTP=otp&&getComputedStyle(otp).display!=='none';
const isProfile=profile.style.display!=='none';
const view=isProfile||isRegister||isOTP||(reset&&getComputedStyle(reset).display!=='none')?'registration':'login';
if(modal.dataset.ceroodAuthView!==view)modal.dataset.ceroodAuthView=view;
if(isRegister){
const saved=phone.value.trim();if(/^[6-9]\d{9}$/.test(saved))input.value=saved;
if(!/^[6-9]\d{9}$/.test(input.value)){if(typeof backToPhoneStep==='function')backToPhoneStep();return;}
const text='+91 '+input.value;if(number.textContent!==text)number.textContent=text;
syncPassword();
}
if(isOTP){const title=document.getElementById('otpTitle');if(title&&title.textContent!=='Check your phone')title.textContent='Check your phone';const info=document.getElementById('setPasswordInfo');const digits=input.value||phone.value;const message='Enter the verification code sent to +91 '+digits+'.';if(info&&info.textContent!==message)info.textContent=message;}
const phoneTitle=document.querySelector('#authStepPhone h3');if(phoneTitle&&phoneTitle.textContent!=='Log in or sign up')phoneTitle.textContent='Log in or sign up';
modal.querySelectorAll('.auth-primary-btn').forEach(b=>{const map={'CONTINUE':'Continue','LOGIN':'Log in','GET OTP & REGISTER':'Continue','VERIFY & CONTINUE':'Continue'};const label=map[b.textContent.trim()];if(label)b.textContent=label;});
const bottom=document.querySelector('#authStepPhone .auth-bottom-link');if(bottom&&!bottom.dataset.ceroodDirectSignup){bottom.dataset.ceroodDirectSignup='1';bottom.onclick=()=>{if(!/^[6-9]\d{9}$/.test(phone.value.trim())){phone.focus();return;}if(typeof switchToNewUserRegisterDirect==='function')switchToNewUserRegisterDirect();};}
lastStep=view;
}
new MutationObserver(update).observe(modal,{attributes:true,attributeFilter:['style','class'],subtree:true});update();
})();
