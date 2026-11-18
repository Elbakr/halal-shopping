const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE',geolocation:{latitude:50.8466,longitude:4.3528},permissions:['geolocation']});
const p=await c.newPage();p.on('console',m=>console.log('LOG',m.text().slice(0,200)));
await p.goto('https://halal.shopping/?lang=fr');await p.waitForTimeout(5000);
const st=async l=>console.log(l,await p.evaluate(()=>{const m=document.getElementById('pmap');return {hidden:m.hidden,h:m.offsetHeight,tiles:[...m.querySelectorAll('img.leaflet-tile')].map(x=>x.src.split('/').slice(-3).join('/')).slice(0,3),markers:m.querySelectorAll('path.leaflet-interactive').length,city:document.getElementById('city').value,first:(document.querySelector('#plist .pln')||{}).textContent}}));
await st('init');await p.click('#near');for(const w of [2000,4000,8000]){await p.waitForTimeout(w);await st('after+'+w)}
await b.close()})()
