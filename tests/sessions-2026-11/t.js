const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],geolocation:{latitude:50.85,longitude:4.37},permissions:['geolocation'],locale:'fr-BE'});const p=await c.newPage();
const req=[];p.on('request',r=>{if(/data\//.test(r.url()))req.push(r.url())});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('https://halal.shopping/#ln459173642');await p.waitForTimeout(6000);
console.log(await p.evaluate(()=>{var b=document.getElementById('ppb');return (b&&!document.getElementById('pp').hidden)?b.innerText.slice(0,300):'no fiche'}));
const wa=await p.evaluate(()=>[...document.querySelectorAll('#ppb a.wa')].map(a=>decodeURIComponent(a.href)).join(' | '));console.log(wa);
await p.screenshot({path:'fiche.png'});console.log(req.slice(0,4).join('\n'));console.log('errors',errs);await b.close()})()
