const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
for(const u of ['https://coif.me/coiffure-arici-2','https://coif.me/coiffure-arici','https://coif.me/']){const r=await p.goto(u);await p.waitForTimeout(2500);console.log('==',u,r.status());console.log((await p.innerText('body')).slice(0,700))}
console.log('errors',errs.slice(0,5));await b.close()})()
