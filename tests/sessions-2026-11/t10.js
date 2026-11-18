const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
// a) GPS allowed
let c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE',geolocation:{latitude:50.8466,longitude:4.3528},permissions:['geolocation']});let p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(9000);
console.log('A first place:',await p.textContent('#plist .pln').catch(()=>'none'),'| msg:',await p.textContent('#pmsg'));
await p.fill('#q','twix');await p.keyboard.press('Enter');await p.waitForTimeout(5000);
console.log('results tiles:',await p.$$eval('#out .tile',e=>e.length));await p.click('[data-pn=clear]');await p.waitForTimeout(500);
console.log('after clear: hidden',await p.$eval('#out',e=>e.hidden),'q=',await p.inputValue('#q'));
await p.click('#plist .pl [data-pk=confirm]').catch(e=>console.log('noconfirm',e.message.slice(0,60)));await p.waitForTimeout(1500);
console.log('mine:',await p.textContent('#mine'));await c.close();
// b) GPS refused
c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(14000);
console.log('B first place:',await p.textContent('#plist .pln').catch(()=>'none'),'| msg:',await p.textContent('#pmsg'));
console.log('errors',errs);await b.close()})()
