const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale:'fr-FR', geolocation:{latitude:50.8605,longitude:4.3606}, permissions:['geolocation'] });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('https://halal.shopping/?lang=fr&v=60',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500); await p.click('#near'); await p.waitForTimeout(5000);
  const card=await p.evaluate(()=>document.querySelector('#plist .pl').innerText.replace(/\n+/g,' | '));
  console.log('1. carte:', card, '| bouton alcool sur la carte:', /alcool/i.test(card));
  console.log('2. filtres:', await p.evaluate(()=>[...document.querySelectorAll('#pfilt .chip')].map(x=>x.innerText).join(' | ')));
  await p.click('[data-pf="open"]'); await p.waitForTimeout(800);
  console.log('3. ouverts maintenant:', await p.evaluate(()=>document.querySelectorAll('#plist .pl').length), await p.evaluate(()=>[...document.querySelectorAll('#plist .pl')].slice(0,2).map(x=>x.querySelector('.ptr').innerText.replace(/\n/g,'+')+' '+x.querySelector('.pln').innerText)));
  await p.click('[data-pf="t_butcher"]'); await p.waitForTimeout(800); await p.click('#addBtn'); await p.waitForTimeout(600);
  console.log('4. ajout depuis Boucherie, type coché:', await p.evaluate(()=>[...document.querySelectorAll('#addKinds .chip')].filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.innerText)), '| champ:', await p.evaluate(()=>{var i=document.getElementById('venueIn');return i.type+' '+i.getAttribute('autocomplete')+' focus='+(document.activeElement===i)}));
  await p.click('[data-ak="r"]'); await p.click('[data-pf="t_fast"]'); await p.waitForTimeout(300);
  console.log('5. choix manuel conservé (Restaurant) :', await p.evaluate(()=>[...document.querySelectorAll('#addKinds .chip')].filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.innerText)));
  await p.click('[data-pf="all"]'); await p.waitForTimeout(500);
  await p.click('#plist .pl:first-child .pln'); await p.waitForTimeout(3500);
  const pg=await p.evaluate(()=>document.getElementById('ppb').innerText.replace(/\n+/g,' | '));
  console.log('6. fiche, boutons alcool présents:', /Vend de l'alcool/.test(pg) && /Pas d'alcool ici/.test(pg));
  console.log('7. liens:', await p.evaluate(()=>[...document.querySelectorAll('#ppb .see a')].map(a=>a.innerText+' → '+decodeURIComponent(a.href).slice(0,95))));
  await p.evaluate(()=>document.querySelector('#ppb .see').scrollIntoView({block:'center'})); await p.screenshot({path:'u1.png'});
  console.log('8. débordement:', await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth), errs);
  // admin link
  const tk=require('fs').readFileSync('admin_token.txt','utf8').trim();
  const p3=await ctx.newPage(); await p3.goto('https://halal.shopping/?lang=fr&v=60#k='+tk,{waitUntil:'domcontentloaded'}); await p3.waitForTimeout(4500);
  console.log('9. lien admin: adresse nettoyée =', !(await p3.evaluate(()=>location.href)).includes(tk), '| message:', await p3.evaluate(()=>[...document.querySelectorAll('.toast,#toast')].map(x=>x.innerText).join(' ')), '| niveau:', await p3.evaluate(()=>document.getElementById('mine').innerText.replace(/\n/g,' ')));
  await b.close();
})().catch(e=>{console.log('ERR',String(e).slice(0,400));process.exit(1)});
