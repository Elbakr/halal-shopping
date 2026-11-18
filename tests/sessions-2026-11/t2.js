const {chromium,devices}=require('playwright');const fs=require('fs');
const ADM=fs.readFileSync(process.argv[2],'utf8').trim();
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});
await c.route(/api\.halal\.shopping\/(api|robots)/,r=>{const u=r.request().url().replace('https://api.halal.shopping','http://127.0.0.1:8099');r.fetch({url:u}).then(res=>r.fulfill({response:res})).catch(()=>r.abort())});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
await p.addInitScript(()=>{try{localStorage.setItem('hs_lang_choice','fr')}catch(e){}});
await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(3000);
console.log('orgBox visible:',await p.isVisible('#orgBox'),'|',await p.textContent('#orgList'));
await p.locator('#orgBox').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/s1.png'});
// product badge
await p.goto('http://127.0.0.1:8765/?lang=fr#p3017620422003');await p.waitForTimeout(5000);
console.log('product badge:',await p.textContent('#ocP').catch(()=>'none'));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/s2.png'});
// registration
await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(2500);
await p.click('#orgJoin');await p.waitForTimeout(500);
await p.fill('#oName','Contrôle Halal Bruxelles (test)');await p.selectOption('#oKind','certifier');await p.fill('#oWeb','example.be');await p.fill('#oEmail','test@example.be');await p.fill('#oRegno','BE-0123');
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/s3.png'});
await p.click('#orgF button[type=submit]');await p.waitForTimeout(1500);
console.log('after register:',(await p.textContent('#omb')).slice(0,200));
const link=await p.inputValue('.okey');console.log('link',link.slice(0,40));
// admin validates
await p.evaluate(a=>localStorage.setItem('hs_dev',a),ADM);await p.goto('http://127.0.0.1:8765/?lang=fr');await p.waitForTimeout(3000);
const adm=await p.isVisible('#orgAdm');console.log('admin button:',adm);
if(adm){await p.click('#orgAdm');await p.waitForTimeout(1000);console.log('admin list:',(await p.textContent('#omb')).slice(0,250));
 await p.locator('[data-st="verified"]').first().click();await p.waitForTimeout(1500);console.log('after validate:',(await p.textContent('#omb')).slice(0,160));}
// org dashboard via link
await p.goto(link.replace('https://halal.shopping/','http://127.0.0.1:8765/'));await p.waitForTimeout(2500);
console.log('dash:',(await p.textContent('#omb')).slice(0,200));
await p.check('input[name=oiT][value=place]');await p.fill('#oiCode','https://api.halal.shopping/l/n459173642');await p.fill('#oiNo','CHB-77');await p.fill('#oiUntil','2027-12-31');
await p.click('#oiF button[type=submit]');await p.waitForTimeout(4000);
await p.fill('#oBulk','5449000000996;CHB-1;2027-01-31\n1234;bad\n3017620422003;CHB-2;2025-01-01');await p.click('#oBulkGo');await p.waitForTimeout(3000);
console.log('dash list:',(await p.textContent('#omb')).match(/Vos certifications[\s\S]{0,300}/)?.[0]);
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/s4.png',fullPage:false});
// place fiche
await p.goto('http://127.0.0.1:8765/?lang=fr#ln459173642');await p.waitForTimeout(6000);
console.log('place badge:',await p.textContent('#ocL').catch(()=>'none'));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/s5.png'});
// public page
await p.click('#ocL a[href^="#org="]');await p.waitForTimeout(2000);console.log('public:',(await p.textContent('#omb')).slice(0,300));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/s6.png'});
console.log('errors',errs);await b.close()})()
