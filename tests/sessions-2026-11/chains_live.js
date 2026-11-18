const { chromium, devices } = require('playwright');
async function at(b,lat,lon,label,fn){ const ctx=await b.newContext({...devices['iPhone 13'],locale:'fr-FR',geolocation:{latitude:lat,longitude:lon},permissions:['geolocation']});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('https://halal.shopping/?lang=fr&v=70',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000); await p.click('#near'); await p.waitForTimeout(5000);
  console.log('== '+label); await fn(p); if(errs.length)console.log('erreurs',errs); await ctx.close(); }
const cards=p=>p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].map(x=>x.querySelector('.pln').innerText+' ['+x.querySelector('.ptr').innerText.replace(/\n/g,'+')+']'));
(async()=>{ const b=await chromium.launch();
  await at(b,48.8936,2.4295,'Romainville (KFC halal annoncé)',async p=>{
    const c=await cards(p); console.log('Tout:',c.filter(x=>/KFC|Quick|McDo/i.test(x)).slice(0,5));
    const kfc=await p.evaluate(()=>{var a=[...document.querySelectorAll('#plist .pl')].find(x=>/KFC/.test(x.querySelector('.pln').innerText));if(a)a.querySelector('.pln').click();return !!a});
    if(kfc){await p.waitForTimeout(3500);console.log('fiche:',await p.evaluate(()=>document.getElementById('ppb').innerText.replace(/\n+/g,' | ').slice(0,330)))} });
  await at(b,50.8466,4.3528,'Bruxelles centre (KFC à vérifier)',async p=>{
    console.log('KFC dans Tout:',(await cards(p)).filter(x=>/KFC/.test(x)).length);
    await p.click('[data-pf="chain"]'); await p.waitForTimeout(1200); console.log('Enseignes à vérifier:',(await cards(p)).slice(0,4));
    await p.click('[data-pf="alc"]'); await p.waitForTimeout(1000); console.log('Alcool / mixtes:',(await cards(p)).filter(x=>/non halal/i.test(x)).slice(0,3));
    console.log('débordement:',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)); });
  await b.close(); })().catch(e=>{console.log('ERR',String(e).slice(0,300));process.exit(1)});
