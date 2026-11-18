const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});const p=await c.newPage();
p.on('response',async r=>{if(r.request().method()!=='GET'){let t='';try{t=(await r.text()).slice(0,300)}catch(e){};console.log('RESP',r.status(),r.url(),r.request().postData()?.slice(0,200),'=>',t)}});
await p.goto('https://coif.me/pro');await p.waitForTimeout(2000);
await p.fill('#pro-salon','Salon Essai Zzq');await p.waitForTimeout(1500);await p.click('text=Voir mon site de salon');await p.waitForTimeout(3000);console.log('URL',p.url());
console.log('---',(await p.innerText('main')).slice(0,700));
const btns=await p.$$eval('button,a',e=>e.map(x=>(x.innerText||'').trim()).filter(Boolean).slice(0,30));console.log(btns.join(' | '));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/c2.png'});
await b.close()})()
