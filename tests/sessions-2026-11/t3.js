const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE',geolocation:{latitude:50.8466,longitude:4.3528},permissions:['geolocation']});
await c.route(/api\.halal\.shopping\/api\//,r=>{const u=r.request().url().replace('https://api.halal.shopping','http://127.0.0.1:8099');r.fetch({url:u}).then(res=>r.fulfill({response:res})).catch(()=>r.abort())});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(2000);
const near=await p.$('#nearBtn, [data-near], button:has-text("autour")');
await p.click('#near');
await p.waitForTimeout(8000);
console.log('certNear:',await p.textContent('#certNear').catch(()=>'-'));
console.log('order:',(await p.$$eval('#plist .pl',e=>e.slice(0,7).map(x=>x.querySelector('.pln').textContent+(x.classList.contains('cok')?' [CERT]':'')))).join(' | '));
console.log('chips:',await p.$$eval('#pfilt .chip',e=>e.map(x=>x.textContent).join(',')));
await p.locator('#certNear').scrollIntoViewIfNeeded().catch(()=>{});await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/k1.png'});
await p.click('#pfilt [data-pf=cert]');await p.waitForTimeout(800);
console.log('filtered:',(await p.$$eval('#plist .pl .pln',e=>e.map(x=>x.textContent))).join(' | '));
await p.goto('http://127.0.0.1:8765/?lang=fr#ln4413952469');await p.waitForTimeout(6000);console.log('page:',(await p.textContent('#ppb')).slice(0,200));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/k2.png'});
console.log('errors',errs);await b.close()})()
