'use strict';
// Isolated push scope: no page, cache or fetch interception.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
function destination(value){try{const url=new URL(value||'/home-services.html',self.location.origin);if(url.origin===self.location.origin&&url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch(_){}return new URL('/home-services.html',self.location.origin).href;}
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch(_){}
 const options={body:String(data.body||'Open Cerood to view updates.').slice(0,180),icon:'/cerood-logo.webp',badge:'/cerood-logo.webp',tag:String(data.tag||'cerood-update').slice(0,120),data:{url:destination(data.url)},actions:[{action:'open',title:String(data.actions?.[0]?.title||'View details').slice(0,30)}]};
 try{const u=new URL(data.image);if(u.protocol==='https:'&&!u.username&&!u.password)options.image=u.href;}catch(_){}
 event.waitUntil(self.registration.showNotification(String(data.title||'Cerood').slice(0,75),options));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const url=destination(event.notification.data?.url);
 event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows)if(client.url===url&&client.focus)return client.focus();if(self.clients.openWindow)return self.clients.openWindow(url);})());
});
