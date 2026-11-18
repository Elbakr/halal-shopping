const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});const p=await c.newPage();
p.on('response',async r=>{if(r.request().method()!=='GET'){let t='';try{t=(await r.text()).slice(0,400)}catch(e){};console.log('RESP',r.status(),r.url(),(r.request().postData()||'').slice(0,200),'=>',t)}});
await p.goto('https://coif.me/inscription');await p.waitForTimeout(2000);
console.log(await p.$$eval('input,button',e=>e.map(x=>x.tagName+' '+x.type+' '+(x.name||x.id)+' '+(x.innerText||x.placeholder||''))));
await p.click('text=Se connecter');await p.waitForTimeout(2500);console.log('URL',p.url());console.log((await p.innerText('main').catch(()=>p.innerText('body'))).slice(0,500));
console.log(await p.$$eval('input,button',e=>e.map(x=>x.tagName+' '+x.type+' '+(x.name||x.id)+' '+(x.innerText||x.placeholder||''))));
await b.close()})()
