const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();let i=0;
for(const base of ['https://halal.shopping/','http://127.0.0.1:8765/']){i++;const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE',geolocation:{latitude:50.8466,longitude:4.3528},permissions:['geolocation']});
await c.route(/api\.halal\.shopping\/api\//,r=>{const u=r.request().url().replace('https://api.halal.shopping','http://127.0.0.1:8099');r.fetch({url:u}).then(res=>r.fulfill({response:res})).catch(()=>r.abort())});
const p=await c.newPage();await p.goto(base+'?lang=fr');await p.waitForTimeout(4000);
await p.click('#near');await p.waitForTimeout(8000);
const tiles=await p.$$eval('#pmap img.leaflet-tile',e=>e.slice(0,2).map(x=>x.src));console.log(base,tiles);await c.close()}
await b.close()})()
