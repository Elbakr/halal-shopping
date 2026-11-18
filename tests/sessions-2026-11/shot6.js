const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale:'fr-FR', geolocation:{latitude:50.8715,longitude:4.3820}, permissions:['geolocation'] });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('https://halal.shopping/?lang=fr&v=50',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(3000); await p.click('#near'); await p.waitForTimeout(5000);
  const L=()=>p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].map(x=>x.innerText.replace(/\n+/g,' | ').slice(0,150)));
  const all=await L(); console.log('Tout',all.length, JSON.stringify(all.filter(x=>/Lambermont|Ruche|Boma/.test(x))));
  await p.click('[data-pf="alc"]'); await p.waitForTimeout(1500); const al=await L(); console.log('Alcool',al.length,JSON.stringify(al.slice(0,4)));
  await p.click('[data-pf="deliv"]'); await p.waitForTimeout(1500); const dv=await L(); console.log('Livraison',dv.length,JSON.stringify(dv.slice(0,2)));
  await p.click('[data-pf="all"]'); await p.selectOption('#psort','top'); await p.waitForTimeout(800); console.log('tri ok',(await L()).length,'ov',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth), errs);
  const p2=await ctx.newPage(); await p2.goto('https://halal.shopping/?lang=fr&v=50#ln10589422860',{waitUntil:'domcontentloaded'}); await p2.waitForTimeout(5000);
  console.log('fiche directe', await p2.evaluate(()=>document.getElementById('ppb').innerText.replace(/\n+/g,' | ').slice(0,260)));
  await b.close();
})().catch(e=>{console.log('ERR',String(e).slice(0,400));process.exit(1)});
