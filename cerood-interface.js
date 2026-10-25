/* Cerood UI copy v1. Only known interface labels; never form values/product data. */
(function(){'use strict';
const phrases={
 'SELLER CENTRE':'Seller centre','SELLER WORKSPACE':'Seller workspace','YOUR BUSINESS':'Your business','THE CEROOD MARKETPLACE':'Sell with Cerood','YOUR SELLER WORKSPACE':'Your seller workspace','BECOME A CEROOD SELLER':'Become a seller','CEROOD SELLER CENTRE':'Seller centre','E-COMMERCE ADMIN':'E-commerce admin','MANAGE YOUR MARKETPLACE':'Manage your marketplace','CEROOD ADMIN CENTRE':'Admin centre','LOCAL':'Local','ADMIN':'Admin','DIRECTORY MANAGEMENT':'Directory management','CEROOD CONTROL CENTRE':'Admin centre','YOUR NEIGHBOURHOOD. DISCOVERED.':'Your neighbourhood, discovered.','THE LOCAL EDIT':'Local businesses','LET US HELP':'Let us help','FOR BUSINESS OWNERS':'For business owners','WELCOME TO CEROOD SHOP':'Welcome to Cerood Shop','01 / THE EVERYDAY EDIT':'01 / The everyday edit','A FRESH PERSPECTIVE':'A fresh perspective','THE COLLECTION':'The collection','BEYOND THE SHOP':'Beyond the shop','YOUR SELECTION':'Your selection','CEROOD SHOP':'Cerood Shop','PRODUCT':'Product','FROM THE COMMUNITY':'Customer reviews','KEEP EXPLORING':'More to explore','CHECKOUT':'Checkout','01 / DELIVERY':'01 / Delivery','02 / PAYMENT':'02 / Payment','SAVE':'Save','CANCEL':'Cancel','ORDER STATUS':'Order status','ORDER TIME':'Order time','＋ ADD A NEW ADDRESS':'＋ Add a new address',
 'Seller Registration':'Seller registration','Owner Name *':'Owner name *','Shop / Business Name *':'Shop / business name *','Mobile Number *':'Mobile number *','Email (Optional)':'Email (optional)','Business Type':'Business type','GST Number (Optional)':'GST number (optional)','Full Address *':'Full address *','Confirm Password *':'Confirm password *','Security Verification':'Security verification','Send OTP':'Send OTP','Edit Details':'Edit details','Verify Mobile Number':'Verify mobile number','One-Time Password':'One-time password','Verify OTP & Submit Registration':'Verify OTP & submit registration','Resend OTP':'Resend OTP','Application Submitted':'Application submitted','Go to Seller Login':'Go to seller login','Home Services ↗':'Home services ↗','My Products':'My products','Add Product':'Add product','My Orders':'My orders','Order Details':'Order details','Customer Details':'Customer details','Payment Details':'Payment details','Delivery Details':'Delivery details','Business Details':'Business details','My Business':'My business','My Enquiries':'My enquiries','Saved Businesses':'Saved businesses','Add Business':'Add business','Business Profile':'Business profile','Product Details':'Product details','Product Images':'Product images','Bulk Upload':'Bulk upload','Upload Images':'Upload images','Save Changes':'Save changes','Sign In':'Sign in','Sign Out':'Sign out'
};
const fixed=new Map(Object.entries(phrases));
const smallUI='.eyebrow,.navlabel,.panel-kicker,.brand small,.wordmark small,.hero-index,.hero-corner,.step-caption,.art-top span';
const controlUI='button,.btn,.button,label,legend,th,nav a,.step-tab,.section-title,.filter-heading';
const preserve=new Map(['OTP','GST','GSTIN','SKU','HSN','UPI','COD','CSV','PDF','SMS','API','PAN','INR','IFSC','ID','URL','RTO','CGST','SGST','IGST'].map(w=>[w.toLowerCase(),w]));
function sentence(text){return text.toLowerCase().replace(/[a-z]+/g,(word,offset)=>preserve.get(word)||(offset===text.search(/[a-z]/i)?word[0].toUpperCase()+word.slice(1):word)).replace(/\bcerood\b/gi,'Cerood');}
function change(node){if(node.nodeType!==3)return;const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,input,option,code,pre,[contenteditable],.product-title,.product-name,#shopName,#productName,.wordmark:not(small),.brand:not(small)')){
 // Brand sublabels are UI; the brand wordmark itself is not.
 if(!parent?.matches('.brand small,.wordmark small'))return;
 }
 const raw=node.nodeValue,trim=raw.trim();if(!trim)return;
 let value;
 if(parent.matches(smallUI))value=fixed.get(trim)||sentence(trim);
 else if(parent.closest(controlUI))value=fixed.get(trim);
 // No broad lowercasing: business names, product names, reviews, IDs, prices,
 // messages and values outside the listed controls remain unchanged.
 if(value&&value!==trim)node.nodeValue=raw.replace(trim,value);
}
function clean(root){if(root.nodeType===3){change(root);return;}if(root.nodeType!==1&&root.nodeType!==9)return;const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode()))change(n);
 for(const el of root.querySelectorAll?.('.hero-index,.hero-corner,.sidebar-note,.panel-kicker')||[]){const text=el.textContent.trim();
  if((el.matches('.hero-index,.hero-corner'))||el.matches('.sidebar-note')||el.matches('.panel-kicker')&&['Become a seller','Become a Cerood seller','BECOME A CEROOD SELLER'].includes(text))el.setAttribute('data-cerood-redundant-copy','');
 }
}
let queued=new Set(),scheduled=false;
function flush(){scheduled=false;const list=[...queued];queued.clear();for(const root of list)if(root.isConnected)clean(root);}
function start(){clean(document.body);new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')queued.add(record.target);else for(const node of record.addedNodes)queued.add(node);}if(!scheduled&&queued.size){scheduled=true;queueMicrotask(flush);}}).observe(document.body,{subtree:true,childList:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
