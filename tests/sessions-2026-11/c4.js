const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'});const p=await c.newPage();
p.on('response',async r=>{if(r.request().method()!=='GET'){let t='';try{t=(await r.text()).slice(0,600)}catch(e){};console.log('RESP',r.status(),r.url(),(r.request().postData()||'').slice(0,300),'=>',t)}});
await p.goto('https://coif.me/inscription');await p.waitForTimeout(2000);
await p.fill('input[name=nom]','Essai Claude test');await p.fill('input[name=mobile]','04XXXXXXXX');await p.waitForTimeout(800);
await p.click('button[type=submit]');await p.waitForTimeout(6000);console.log('URL',p.url());
console.log((await p.innerText('body')).slice(0,900));
await p.screenshot({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/c4.png'});
const ck=await c.cookies();console.log('cookies',ck.map(x=>x.name));
// resend code
const rs=await p.$('text=Renvoyer le code');if(rs){await rs.click();await p.waitForTimeout(4000);console.log('after resend:',(await p.innerText('body')).slice(0,300))}
await c.storageState({path:'/tmp/claude-0/-home-claude/b1e999ef-e600-5291-9431-c0f0a5755a1b/scratchpad/coif_state.json'});
await b.close()})()
