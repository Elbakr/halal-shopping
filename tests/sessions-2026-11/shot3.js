const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale:'fr-FR', colorScheme:'dark', geolocation:{latitude:50.8605,longitude:4.3606}, permissions:['geolocation'] });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8765/?lang=fr',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2500); await p.click('#near'); await p.waitForTimeout(5000);
  await p.click('[data-pf="t_butcher"]'); await p.waitForTimeout(4000);
  console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].slice(0,6).map(x=>x.innerText.replace(/\n+/g,' | ').slice(0,170)))));
  await p.evaluate(()=>document.querySelector('#plist .pl').scrollIntoView()); await p.screenshot({path:'l1.png'});
  await p.click('#plist .pl:nth-child(2) .pln'); await p.waitForTimeout(3500);
  console.log(await p.evaluate(()=>location.hash+' '+document.getElementById('ppb').innerText.replace(/\n+/g,' | ').slice(0,400)), 'ov', await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await p.screenshot({path:'l2.png'});
  await p.click('#ppx'); await p.waitForTimeout(300); console.log('closed', await p.evaluate(()=>document.getElementById('pp').hidden+' '+location.hash));
  // direct link to a place that is not in the loaded list
  const p2 = await ctx.newPage(); await p2.goto('http://localhost:8765/?lang=fr#ln9999744775',{waitUntil:'domcontentloaded'}); await p2.waitForTimeout(5000);
  console.log('direct', await p2.evaluate(()=>!document.getElementById('pp').hidden+' '+document.getElementById('ppb').innerText.replace(/\n+/g,' | ').slice(0,200)), errs);
  await b.close();
})().catch(e=>{console.log('ERR',String(e).slice(0,400));process.exit(1)});
