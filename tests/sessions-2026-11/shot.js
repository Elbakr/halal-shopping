const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale:'fr-FR', geolocation:{latitude:50.8605,longitude:4.3606}, permissions:['geolocation'], ignoreHTTPSErrors:true });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('https://halal.shopping/?lang=fr&v=26',{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForTimeout(3000); await p.click('#near'); await p.waitForTimeout(5000);
  const info = await p.evaluate(()=>({n:document.querySelectorAll('#plist .pl').length, ov:document.documentElement.scrollWidth>innerWidth, w:innerWidth, mission:document.getElementById('mission').innerText.slice(0,80), first:[...document.querySelectorAll('#plist .pl b')].slice(0,5).map(x=>x.innerText)}));
  console.log(JSON.stringify(info), errs);
  await p.evaluate(()=>document.getElementById('places').scrollIntoView()); await p.waitForTimeout(800);
  await p.screenshot({path:'m1.png'});
  await p.click('#missionGo').catch(()=>{}); await p.waitForTimeout(300); await p.evaluate(()=>document.getElementById('mission').scrollIntoView({block:'center'})); await p.screenshot({path:'m2.png'});
  await p.click('[data-pf="t_butcher"]'); await p.waitForTimeout(1500); console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].slice(0,6).map(x=>x.querySelector('b').innerText+' '+x.querySelector('.pm').innerText))));
  await b.close();
})().catch(e=>{console.log('ERR',String(e).slice(0,300));process.exit(1)});
