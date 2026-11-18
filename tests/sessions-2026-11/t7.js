const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('https://halal.shopping/?lang=fr');await p.waitForTimeout(3000);
await p.fill('#q','mars');await p.keyboard.press('Enter');await p.waitForTimeout(5000);
console.log('results:',(await p.$$eval('#out .tile b',e=>e.slice(0,6).map(x=>x.textContent))).join(' | '));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/live-mars.png'});
await p.goto('https://halal.shopping/?lang=fr#a=e542');await p.waitForTimeout(3000);console.log('e542',await p.$eval('#vmb iframe',f=>f.src.split('/embed/')[1]).catch(()=>'none'));
console.log('errors',errs);await b.close()})()
