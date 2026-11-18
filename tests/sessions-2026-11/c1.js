const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});const p=await c.newPage();
p.on('response',r=>{if(r.request().method()!=='GET')console.log('RESP',r.status(),r.url())});
await p.goto('https://coif.me/pro');await p.waitForTimeout(2500);
console.log((await p.innerText('body')).slice(0,1500));
const inputs=await p.$$eval('input,button,a[href]',e=>e.map(x=>x.tagName+' '+(x.type||'')+' '+(x.name||x.id||'')+' '+(x.placeholder||x.innerText||x.getAttribute('href')||'').slice(0,50)));console.log(inputs.join('\n'));
await b.close()})()
