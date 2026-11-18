// TEST ZÉRO — parcours en lecture seule sur le site EN LIGNE (halal.shopping), sans session.
// Toute requête d'écriture (POST/PATCH/PUT/DELETE) vers l'API est bloquée et comptée : aucune contribution réelle possible.
// Usage : node test_zero.js <dossier de sortie>
// Variables : SITE (défaut https://halal.shopping/) ; API (défaut https://api.halal.shopping) : les appels du site vers
// api.halal.shopping sont redirigés vers cette adresse (serveur d'essai de la porte), en lecture seule.
// Code de sortie : 0 tout vert, 1 au moins un rouge (la porte applique ensuite le cliquet des rouges connus, voir porte.js).
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const OUT = process.argv[2] || '.'; fs.mkdirSync(OUT, { recursive: true });
const SITE = (process.env.SITE || 'https://halal.shopping/').replace(/\/?$/, '/');
const API = (process.env.API || 'https://api.halal.shopping').replace(/\/$/, '');
const PROD_API = 'https://api.halal.shopping';
const PROFILES = { 'iphone13': devices['iPhone 13'], 'android': devices['Pixel 7'] };
const results = [];
async function run(pname, dev) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...dev, locale: 'fr-BE', geolocation: { latitude: 50.8466, longitude: 4.3528 }, permissions: ['geolocation'] });
  let blockedWrites = [];
  await ctx.route(/https:\/\/api\.halal\.shopping\//, r => { const m = r.request().method(), u = r.request().url();
    if (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS') { if (!/\/api\/hs\/hit$/.test(u)) blockedWrites.push(m + ' ' + u); return r.abort(); }
    // Fichiers servis par Caddy (/data/) : toujours ceux de la production. Le reste : serveur d'essai.
    if (API !== PROD_API && !/^\/data\//.test(u.slice(PROD_API.length))) return r.fetch({ url: API + u.slice(PROD_API.length), timeout: 30000 }).then(x => r.fulfill({ response: x })).catch(() => r.abort());
    return r.continue(); });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }); // 4G ralentie
  let errs = [], fails = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 160)));
  p.on('requestfailed', r => { const f = r.failure() && r.failure().errorText || ''; if (!/ERR_ABORTED/.test(f) || !/api\.halal\.shopping/.test(r.url())) fails.push((f + ' ' + r.url()).slice(0, 160)); });
  p.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) fails.push(r.status() + ' ' + r.url().slice(0, 140)); });
  async function screen(name, fn) {
    errs = []; fails = []; const t0 = Date.now(); let ok = true, note = '';
    try { note = (await fn()) || ''; } catch (e) { ok = false; note = 'ÉCHEC : ' + e.message.split('\n')[0].slice(0, 200); }
    const ms = Date.now() - t0; const shot = path.join(OUT, pname + '-' + name.replace(/[^a-z0-9]+/gi, '_') + '.png');
    try { await p.screenshot({ path: shot }); } catch (e) {}
    const fl = fails.filter(f => !/google-analytics|doubleclick|ytimg.*\/vi_webp|googlevideo|youtube\.com\/(api|generate_204|ptracking)|play\.google|jnn-pa/.test(f));
    const er = errs.filter(e => !/youtube|ytimg|doubleclick|Failed to load resource: the server responded with a status of 4\d\d \(\)/.test(e));
    results.push({ profil: pname, ecran: name, vert: ok && !er.length, ms, note, erreurs: er.slice(0, 5), echecs: fl.slice(0, 5), capture: path.basename(shot) });
  }
  const count = () => p.evaluate(() => [...document.querySelectorAll('button,a,input,select,textarea')].filter(e => e.offsetParent !== null).length);
  // 1. Accueil
  await screen('accueil', async () => { const t = Date.now(); await p.goto(SITE + '?lang=fr', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#q', { state: 'visible', timeout: 15000 }); const d = Date.now() - t; await p.waitForTimeout(2000); return 'champ visible en ' + d + ' ms ; ' + (await count()) + ' éléments cliquables' + (d > 2500 ? ' ; LENT (> 2,5 s)' : ''); });
  // 2. Autour de moi (position GPS)
  await screen('autour_de_moi', async () => { await p.waitForFunction(() => document.querySelectorAll('#plist .pl').length > 0, null, { timeout: 25000 }); const n = await p.$$eval('#plist .pl', e => e.length); const first = await p.textContent('#plist .pl .pln'); const msg = await p.textContent('#pmsg'); if (/approximative/i.test(msg)) throw new Error('position IP au lieu du GPS : ' + msg); return n + ' lieux ; premier : ' + first; });
  // 3. Filtres
  await screen('filtres', async () => { const chips = await p.$$eval('#pfilt [data-pf]', e => e.map(x => x.dataset.pf)); for (const c of chips.slice(0, 6)) { await p.click('#pfilt [data-pf="' + c + '"]'); await p.waitForTimeout(300); } await p.click('#pfilt [data-pf="all"]'); return 'filtres : ' + chips.join(','); });
  // 4. Fiche d'un lieu + navigation + réservation + fermeture
  await screen('fiche_lieu', async () => { await p.click('#plist .pl [data-open]'); await p.waitForSelector('#pp:not([hidden]) #ppb h2', { timeout: 15000 }); const h = await p.textContent('#ppb h2'); const nav = await p.textContent('#ppnav'); const book = await p.$('#ppb .book'); await p.click('#ppnav [data-pv="1"]').catch(() => {}); await p.waitForTimeout(2500); const h2 = await p.textContent('#ppb h2'); await p.click('#ppx2'); await p.waitForTimeout(500); const closed = await p.$eval('#pp', e => e.hidden); if (!closed) throw new Error('la fiche ne se ferme pas'); return h + ' → ' + h2 + ' ; ' + nav.trim() + ' ; réservation : ' + (book ? 'oui' : 'non (pas resto ou pas de tél.)'); });
  // 5. Recherche par nom
  await screen('recherche_nom', async () => { await p.fill('#q', 'mars'); await p.keyboard.press('Enter'); await p.waitForSelector('#out .tile', { timeout: 20000 }); const names = await p.$$eval('#out .tile b', e => e.slice(0, 3).map(x => x.textContent)); if (!/mars/i.test(names[0])) throw new Error('premier résultat sans « mars » : ' + names[0]); return names.join(' | '); });
  // 6. Fiche produit depuis les résultats, suivante, fermeture, effacement
  await screen('fiche_produit_resultats', async () => { await p.click('#out .tile'); await p.waitForSelector('#out .answer h2', { timeout: 20000 }); const a = await p.textContent('#out .pnc'); await p.click('[data-pn="1"]'); await p.waitForTimeout(4000); const b2 = await p.textContent('#out .pnc'); await p.click('[data-pn="close"]'); await p.waitForTimeout(800); const tiles = await p.$$eval('#out .tile', e => e.length); await p.click('[data-pn="clear"]'); await p.waitForTimeout(500); const hidden = await p.$eval('#out', e => e.hidden); if (!tiles || !hidden) throw new Error('retour liste ' + tiles + ' / effacé ' + hidden); return a.trim() + ' → ' + b2.trim() + ' ; liste revue (' + tiles + ') ; effacée'; });
  // 7. Code-barres direct
  await screen('produit_code_barres', async () => { const t = Date.now(); await p.evaluate(() => { location.hash = '#p3017620422003'; }); await p.waitForSelector('#out .answer h2', { timeout: 20000 }); const d = Date.now() - t; return (await p.textContent('#out .answer h2')) + ' : ' + (await p.textContent('#out .banner')).replace(/\s+/g, ' ').slice(0, 60) + ' ; affiché en ' + d + ' ms' + (d > 2500 ? ' ; LENT' : ''); });
  // 8. Vidéo d'additif
  await screen('video_additif', async () => { await p.evaluate(() => { location.hash = '#a=e441'; }); await p.waitForSelector('#vmb iframe', { timeout: 15000 }); const src = await p.$eval('#vmb iframe', f => f.src.split('/embed/')[1].split('?')[0]); const wa = await p.$('#vmb a.wa'); return 'vidéo ' + src + (wa ? ' ; bouton WhatsApp présent' : ' ; PAS de WhatsApp'); });
  // 9. Langue arabe
  await screen('langue_ar', async () => { await p.goto(SITE + '?lang=ar', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); const dir = await p.evaluate(() => document.documentElement.dir); if (dir !== 'rtl') throw new Error('pas en droite à gauche'); return 'dir=' + dir + ' ; ' + (await p.textContent('h1')).slice(0, 40); });
  // 10. Formulaire organisme (ouvert, jamais envoyé)
  await screen('organisme_formulaire', async () => { await p.goto(SITE + '?lang=fr', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#orgBox:not([hidden])', { timeout: 15000 }); await p.click('#orgJoin'); await p.waitForSelector('#orgF', { timeout: 10000 }); const f = await p.$$eval('#orgF input,#orgF select,#orgF textarea', e => e.length); await p.click('#omx'); return f + ' champs ; fermé sans envoi'; });
  results.push({ profil: pname, ecran: '(écritures bloquées)', vert: blockedWrites.length === 0, ms: 0, note: blockedWrites.length + ' tentative(s) d\'écriture bloquée(s)', erreurs: blockedWrites.slice(0, 5), echecs: [], capture: '' });
  await b.close();
}
async function bots() { // pages de partage vues par les robots (aperçus WhatsApp, Google)
  const get = (u, ua) => new Promise(res => { const t = Date.now(); if (!/\/sitemap/.test(u)) u = API + u.slice(PROD_API.length); (u.startsWith('https') ? require('https') : require('http')).get(u, { headers: { 'User-Agent': ua } }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d, ms: Date.now() - t, loc: r.headers.location })); }).on('error', e => res({ s: 0, d: String(e), ms: 0 })); });
  for (const [n, u, want] of [['partage_lieu', 'https://api.halal.shopping/l/n2333276696', /<title>/], ['partage_produit', 'https://api.halal.shopping/p/3017620422003', /est-il halal/], ['partage_video', 'https://api.halal.shopping/a/e441', /Gélatine/], ['robots', 'https://api.halal.shopping/robots.txt', /Sitemap/], ['sitemap', 'https://api.halal.shopping/sitemap.xml', /sitemapindex/]]) {
    const r = await get(u, 'WhatsApp/2.23'); const ok = r.s === 200 && want.test(r.d); results.push({ profil: 'robot', ecran: n, vert: ok, ms: r.ms, note: r.s + ' ' + ((r.d.match(/<title>([^<]*)/) || [])[1] || r.d.slice(0, 60)).replace(/\s+/g, ' '), erreurs: [], echecs: ok ? [] : [r.s + ' ' + u], capture: '' });
  }
  const h = await get('https://api.halal.shopping/l/n2333276696', 'Mozilla/5.0 (iPhone)'); results.push({ profil: 'robot', ecran: 'partage_humain_redirige', vert: h.s === 302 && /halal\.shopping\/#l/.test(h.loc || ''), ms: h.ms, note: h.s + ' → ' + h.loc, erreurs: [], echecs: [], capture: '' });
}
(async () => { const T = Date.now(); for (const [n, d] of Object.entries(PROFILES)) await run(n, d); await bots();
  fs.writeFileSync(path.join(OUT, 'resultats.json'), JSON.stringify(results, null, 1));
  for (const r of results) console.log((r.vert ? 'VERT ' : 'ROUGE') + ' | ' + r.profil + ' | ' + r.ecran + ' | ' + r.ms + ' ms | ' + r.note + (r.erreurs.length ? ' | console: ' + r.erreurs.join(' ; ') : '') + (r.echecs.length ? ' | échecs: ' + r.echecs.join(' ; ') : ''));
  console.log('Durée totale : ' + Math.round((Date.now() - T) / 1000) + ' s'); process.exit(results.every(r => r.vert) ? 0 : 1); })().catch(e => { console.log('ROUGE | test | plantage | 0 ms | ' + e.message); process.exit(1); });
