const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale:'fr-FR', geolocation:{latitude:50.8605,longitude:4.3606}, permissions:['geolocation'] });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8766/?lang=fr',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2500); await p.click('#near'); await p.waitForTimeout(5000);
  const names=()=>p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].map(x=>x.querySelector('.pln').innerText));
  const first=(await names())[0]; console.log('filters',await p.evaluate(()=>[...document.querySelectorAll('#pfilt .chip')].map(x=>x.innerText).join(' | ')),'| sort',await p.evaluate(()=>[...document.querySelectorAll('#psort option')].map(x=>x.innerText).join(',')));
  console.log('first',first, await p.evaluate(()=>document.querySelector('#plist .pl').innerText.replace(/\n+/g,' | ')));
  await p.click('#plist .pl:first-child [data-pk="alcohol"]'); await p.waitForTimeout(3500);
  console.log('after alcohol: still in Tout?',(await names()).includes(first));
  await p.click('[data-pf="alc"]'); await p.waitForTimeout(1500);
  console.log('alc filter:',await p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].slice(0,3).map(x=>x.innerText.replace(/\n+/g,' | ').slice(0,200))));
  await p.evaluate(()=>document.getElementById('plist').scrollIntoView()); await p.screenshot({path:'a1.png'});
  // open page, rate 4, check, unrate, then withdraw alcohol
  await p.click('#plist .pl:first-child .pln'); await p.waitForTimeout(3000);
  await p.click('#ppb [data-star="4"]'); await p.waitForTimeout(3000);
  console.log('page:',await p.evaluate(()=>document.getElementById('ppb').innerText.replace(/\n+/g,' | ').slice(-420)));
  await p.evaluate(()=>document.querySelector('#ppb .stars').scrollIntoView({block:'center'})); await p.screenshot({path:'a2.png'});
  await p.click('#ppb [data-star="4"]'); await p.waitForTimeout(3000);
  await p.click('#ppb [data-pk="alcohol"]'); await p.waitForTimeout(3500);
  console.log('after undo page status:',await p.evaluate(()=>document.querySelector('#ppb .ptr').innerText.replace(/\n+/g,' | ')), '| rating title:',await p.evaluate(()=>document.querySelector('#ppb .stars').parentNode.querySelector('h3').innerText));
  await p.click('#ppx'); await p.click('[data-pf="all"]'); await p.waitForTimeout(2500);
  console.log('back in Tout?',(await names()).includes(first),'ov',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth), errs);
  await b.close();
})().catch(e=>{console.log('ERR',String(e).slice(0,400));process.exit(1)});
