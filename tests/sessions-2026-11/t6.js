const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});await c.route(/api\.halal\.shopping\/api\//,r=>{const u=r.request().url().replace('https://api.halal.shopping','http://127.0.0.1:8099');r.fetch({url:u}).then(res=>r.fulfill({response:res})).catch(()=>r.abort())});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(2500);
await p.fill('#q','mars');await p.keyboard.press('Enter');await p.waitForTimeout(5000);
console.log('results:',(await p.$$eval('#out .tile b',e=>e.slice(0,8).map(x=>x.textContent))).join(' | '));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/r1.png'});
await p.click('#out .tile');await p.waitForTimeout(4000);console.log('after pick:',(await p.textContent('#out h2')),p.url().slice(-20));
for(const l of ['fr','tr','ar','de']){await p.goto('http://127.0.0.1:8765/?lang='+l+'#a=e441');await p.waitForTimeout(2500);console.log(l,await p.$eval('#vmb iframe',f=>f.src.split('/embed/')[1]),await p.$eval('#vmb .src',e=>e.textContent))}
await p.goto('http://127.0.0.1:8765/?lang=fr#a=e631');await p.waitForTimeout(2000);console.log('e631',await p.$eval('#vmb iframe',f=>f.src.split('/embed/')[1]));
let nav='';p.on('framenavigated',f=>{if(f===p.mainFrame())nav=f.url()});
const req=[];c.on('request',r=>req.push(r.url()));
await p.click('#vmb a.wa').catch(e=>console.log('clickerr',e.message.slice(0,80)));await p.waitForTimeout(1500);
console.log('wa nav:',nav, req.filter(u=>/wa\.me|whatsapp/.test(u)));
console.log('errors',errs);await b.close()})()
