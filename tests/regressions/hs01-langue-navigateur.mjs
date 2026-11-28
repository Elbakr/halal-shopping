import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium, devices } = require('playwright');
const [base, out] = [process.argv[2], process.argv[3]];
const b = await chromium.launch(); const res = {};
for (const [nom, dev] of [['iphone13', devices['iPhone 13']], ['pixel7', devices['Pixel 7']], ['bureau', { viewport: { width: 1366, height: 800 } }]]) {
  const c = await b.newContext({ ...dev, locale: 'fr-BE' }); const p = await c.newPage();
  await p.route('https://api.country.is/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ip":"88.99.0.1","country":"DE"}' }));
  await p.route('https://get.geojs.io/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"country_code":"DE","latitude":"51","longitude":"9","city":"Falkenstein"}' }));
  await p.goto(base, { waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
  res[nom] = await p.evaluate(() => ({ lang: document.documentElement.lang, ph: document.getElementById('q')?.placeholder, h1: document.querySelector('h1')?.innerText.slice(0, 40), sel: document.getElementById('lang')?.value }));
  await p.screenshot({ path: `${out}-${nom}.png` }); await c.close();
}
console.log(JSON.stringify(res, null, 1)); await b.close();
