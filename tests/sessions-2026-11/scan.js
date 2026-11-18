const { chromium, devices } = require('playwright');
const D='/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/';
(async()=>{
  const b = await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+D+'ean.y4m']});
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale:'fr-FR', permissions:['camera'] });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8768/?lang=fr',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2000);
  console.log('détecteur natif ?', await p.evaluate(()=>'BarcodeDetector' in window));
  await p.click('#cam'); 
  for(let i=0;i<20;i++){ await p.waitForTimeout(1000); const h=await p.evaluate(()=>location.hash); if(h.startsWith('#p'))break; }
  console.log('caméra → hash', await p.evaluate(()=>location.hash), '| vidéo cachée', await p.evaluate(()=>document.getElementById('v').hidden), '| lecteur chargé', await p.evaluate(()=>!!window.BarcodeDetectionAPI));
  await p.waitForTimeout(2500); console.log('fiche:', await p.evaluate(()=>(document.getElementById('out').innerText||'').replace(/\n+/g,' | ').slice(0,160)));
  // photo path
  const p2 = await ctx.newPage(); await p2.goto('http://localhost:8768/?lang=fr',{waitUntil:'domcontentloaded'}); await p2.waitForTimeout(1500);
  await p2.setInputFiles('#photo', D+'ean.png'); for(let i=0;i<15;i++){ await p2.waitForTimeout(1000); if((await p2.evaluate(()=>location.hash)).startsWith('#p'))break; }
  console.log('photo → hash', await p2.evaluate(()=>location.hash), errs);
  await b.close();
})().catch(e=>{console.log('ERR',String(e).slice(0,400));process.exit(1)});
