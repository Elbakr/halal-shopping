const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  for (const [name,lat,lon] of [["Charleroi sud",50.36,4.44],["rue de Brabant",50.8605,4.3606]]) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], locale:'fr-FR', geolocation:{latitude:lat,longitude:lon}, permissions:['geolocation'] });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto('https://halal.shopping/?lang=fr&v=30',{waitUntil:'domcontentloaded',timeout:45000});
    await p.waitForTimeout(3000); await p.click('#near'); await p.waitForTimeout(4000);
    const L=()=>p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].map(x=>x.querySelector('b').innerText+' ['+x.querySelector('.ptr').innerText.replace(/\n/g,'+')+'] '+x.querySelector('.pm').innerText.split(' · ').pop()));
    const all=await L(); console.log(name,'TOUT',all.length,JSON.stringify(all.slice(0,12)));
    console.log(' boucheries dans Tout:',all.filter(x=>x.includes('[BOUCHERIE')).length, ' city=',JSON.stringify(await p.inputValue('#city')));
    await p.click('[data-pf="t_butcher"]'); await p.waitForTimeout(1200); const bl=await L(); console.log(' BOUCHERIE',bl.length,JSON.stringify(bl.slice(0,12)), errs);
    await ctx.close();
  }
  await b.close();
})().catch(e=>{console.log('ERR',String(e).slice(0,300));process.exit(1)});
