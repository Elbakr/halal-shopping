const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE',geolocation:{latitude:50.8466,longitude:4.3528},permissions:['geolocation']});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
async function sw(sel,dx){const box=await p.locator(sel).first().boundingBox();const x=box.x+box.width/2,y=Math.min(box.y+200,700);await p.touchscreen.tap? null:null;
 await p.evaluate(([sel,x,y,dx])=>{const el=document.querySelector(sel);const mk=(t,X)=>new TouchEvent(t,{bubbles:true,cancelable:true,touches:t==='touchend'?[]:[new Touch({identifier:1,target:el,clientX:X,clientY:y})],changedTouches:[new Touch({identifier:1,target:el,clientX:X,clientY:y})]});el.dispatchEvent(mk('touchstart',x));el.dispatchEvent(mk('touchend',x+dx))},[sel,x,y,dx])}
await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(2500);
await p.fill('#q','twix');await p.keyboard.press('Enter');await p.waitForTimeout(5000);
await p.click('#out .tile');await p.waitForTimeout(4000);
console.log('nav1:',await p.textContent('#out .pnav'),'|',await p.textContent('#out h2'));
await sw('#out .answer',-150);await p.waitForTimeout(4000);console.log('after swipe:',await p.textContent('#out .pnc'),'|',await p.textContent('#out h2'));
await p.click('[data-pn="1"]');await p.waitForTimeout(4000);console.log('after next:',await p.textContent('#out .pnc'));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/n1.png'});
await p.click('[data-pn="close"]');await p.waitForTimeout(1000);console.log('after close tiles:',await p.$$eval('#out .tile',e=>e.length));
// venues
await p.click('#near');await p.waitForTimeout(8000);
await p.click('#plist .pl [data-open]');await p.waitForTimeout(5000);
console.log('place nav:',await p.textContent('#ppnav'),'|',await p.textContent('#ppb h2'));
await sw('#pp',-150);await p.waitForTimeout(4000);console.log('after swipe:',await p.textContent('#ppnav'),'|',await p.textContent('#ppb h2'));
await p.goto('http://127.0.0.1:8765/?lang=fr#ln4413952478');await p.waitForTimeout(6000);
console.log('book:',await p.textContent('#ppb .book').catch(()=>'none'));
await p.locator('#ppb .book').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/n2.png'});
let nav='';p.on('framenavigated',f=>{if(f===p.mainFrame())nav=f.url()});const req=[];c.on('request',r=>req.push(r.url()));
await p.click('#bkGo');await p.waitForTimeout(1000);console.log('bkGo ->',nav,req.filter(u=>/^tel:|whatsapp/.test(u)));
await p.click('#ppx2');await p.waitForTimeout(800);console.log('pp hidden after ✕:',await p.$eval('#pp',e=>e.hidden));
console.log('errors',errs);await b.close()})()
