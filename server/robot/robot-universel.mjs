// ROBOT UNIVERSEL (socle uxlab, 18/11/2026) : parcourt un site comme un humain, en LECTURE SEULE garantie.
// Il lit les vrais boutons de chaque ecran (role + texte visibles), clique chacun, et controle le resultat.
// Aucun texte fixe : les tests ne vieillissent pas quand un bouton change de nom. build by Uxlab.ai
// Usage : node robot-universel.mjs <url-de-base> <dossier-sortie> [max-ecrans=40] [max-clics-par-ecran=25] [appareil=iPhone 13]
// Sortie : <dossier>/rapport.json (+ captures) ; derniere ligne : FIN ... ; code 0 = vert, 1 = rouge, 2 = NON VALABLE (serveur malade)
// Copie du socle uxlab pour halal.shopping : server/robot/ (lancé chaque nuit par hs-robot.timer, voir robot.sh).
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(process.env.PW_PACKAGE || import.meta.url)
const { chromium, devices } = require('playwright')
const [BASE0, OUT, MAXE = '40', MAXC = '25', APP = 'iPhone 13'] = process.argv.slice(2)
if (!BASE0 || !OUT) { console.log('usage : node robot-universel.mjs <url> <sortie> [maxEcrans] [maxClics] [appareil]'); process.exit(2) }
const BASE = BASE0.replace(/\/$/, ''), ORIG = new URL(BASE).origin
fs.mkdirSync(OUT, { recursive: true })
const DANGER = /supprim|effac|retir|delete|remove|d[ée]connex|logout|sign ?out|payer|acheter|commander|envoyer|send|valider|confirmer|publier|r[ée]server|s'inscrire|inscription|soumettre|submit|annuler|cancel|ban|bloquer/i
const t0 = Date.now()
const sante = []
for (let i = 0; i < 3; i++) {
  const s = Date.now()
  try { const r = await fetch(BASE + '/', { redirect: 'follow' }); sante.push({ statut: r.status, ms: Date.now() - s }) }
  catch (e) { sante.push({ statut: 0, ms: Date.now() - s, erreur: String(e).slice(0, 80) }) }
}
const santeOK = sante.every(x => x.statut >= 200 && x.statut < 400) && Math.max(...sante.map(x => x.ms)) < 5000
if (!santeOK) {
  fs.writeFileSync(`${OUT}/rapport.json`, JSON.stringify({ base: BASE, valable: false, sante }, null, 1))
  console.log(`FIN NON VALABLE : serveur malade avant le test ${JSON.stringify(sante)}`); process.exit(2)
}
const b = await chromium.launch()
const ctx = await b.newContext({ ...(devices[APP] || devices['iPhone 13']), locale: 'fr-BE' })
const ecrituresBloquees = []
await ctx.route('**/*', r => {
  const m = r.request().method()
  if (['GET', 'HEAD', 'OPTIONS'].includes(m)) return r.continue()
  ecrituresBloquees.push(m + ' ' + r.request().url().replace(ORIG, '').split('?')[0]); return r.abort()
})
const p = await ctx.newPage()
p.on('dialog', d => d.dismiss().catch(() => {}))
// Écrans de départ (halal.shopping, 21/11) : une application d'une seule page n'a pas de liens à suivre ; ROBOT_DEPART="/?lang=fr,/?lang=ar" en donne plusieurs.
const vus = new Set(), formes = new Map(), file = (process.env.ROBOT_DEPART || '/').split(',').map(x => x.trim()).filter(Boolean), ecrans = [], rouges = []
const cle = u => u.split('#')[0]
const SEL = 'a[href],button,[role=button],[role=tab],[role=link],input,select,textarea,summary,[onclick]'
while (file.length && ecrans.length < +MAXE) {
  const u = cle(file.shift()); if (vus.has(u)) continue; vus.add(u)
  const forme = u.split('?')[0].split('/').map((s, i, a) => (i === a.length - 1 && (i > 1 || /[-0-9_]/.test(s))) ? '*' : s).join('/') + (u.includes('lang=') ? '?lang' : '')
  if ((formes.get(forme) || 0) >= 2) continue; formes.set(forme, (formes.get(forme) || 0) + 1)
  const err = [], req = []
  const onC = m => { if (m.type() === 'error' && !/net::ERR_FAILED|net::ERR_BLOCKED|ERR_ABORTED/.test(m.text())) err.push(m.text().slice(0, 140)) }
  const onP = e => err.push('erreur de script ' + e.message.slice(0, 120))
  const onR = r => { const s = r.status(); if ((s >= 500 || (s >= 400 && r.request().resourceType() !== 'document')) && r.url().startsWith(ORIG)) req.push(s + ' ' + r.url().replace(ORIG, '').split('?')[0]) }
  p.on('console', onC); p.on('pageerror', onP); p.on('response', onR)
  const s0 = Date.now(); let st = 0
  try { const r = await p.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 30000 }); st = r ? r.status() : 0; await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}) }
  catch (e) { err.push('ouverture ' + e.message.slice(0, 80)) }
  const ms = Date.now() - s0
  const m = await p.evaluate((SEL) => {
    const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' }
    const nom = e => (e.getAttribute('aria-label') || e.innerText || e.value || e.getAttribute('title') || e.getAttribute('name') || '').trim().replace(/\s+/g, ' ').slice(0, 60)
    const el = [...document.querySelectorAll(SEL)].filter(vis)
    return {
      largeur: document.documentElement.scrollWidth, fenetre: innerWidth, titre: document.title,
      vide: document.body.innerText.trim().length < 40,
      imgKO: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.offsetParent).length,
      liens: [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith(location.origin)).map(h => h.slice(location.origin.length)).filter(h => !/\.(pdf|ics|xml|png|jpe?g|webp|zip)(\?|$)|\/api\//.test(h)),
      elements: el.map((e, i) => ({ i, tag: e.tagName.toLowerCase(), role: e.getAttribute('role') || '', type: e.getAttribute('type') || '', nom: nom(e) }))
    }
  }, SEL).catch(() => ({ largeur: 0, fenetre: 0, titre: '', vide: true, imgKO: 0, liens: [], elements: [] }))
  const n = String(ecrans.length + 1).padStart(2, '0')
  await p.screenshot({ path: `${OUT}/${n}.png` }).catch(() => {})
  const cliquables = m.elements.filter(e => (e.tag === 'button' || e.role === 'button' || e.role === 'tab' || e.tag === 'summary') && e.type !== 'submit' && !DANGER.test(e.nom))
  const clics = []
  const occ = new Map()
  for (const e of cliquables.slice(0, +MAXC)) {
    const avant = err.length
    // Le bouton est retrouvé par son NOM et son rang parmi les boutons du même nom : une page qui se remplit
    // en arrière-plan (lieux, votes) ne décale plus la cible (halal.shopping, 21/11).
    const k = occ.get(e.nom) || 0; occ.set(e.nom, k + 1)
    const cible = e.nom ? p.locator(SEL).filter({ visible: true }).filter({ hasText: e.nom }).nth(k) : p.locator(SEL).filter({ visible: true }).nth(e.i)
    try {
      await (await cible.count() ? cible : p.locator(SEL).filter({ visible: true }).nth(e.i)).click({ timeout: 4000 })
      await p.waitForTimeout(400)
      clics.push({ nom: e.nom || '(sans nom)', ok: err.length === avant })
    } catch (x) { clics.push({ nom: e.nom || '(sans nom)', ok: false, raison: 'ne repond pas : ' + x.message.split('\n')[0].slice(0, 70) }) }
    // Après chaque clic, l'écran est rechargé : la liste des boutons ne bouge pas sous le robot (sinon le n-ième bouton n'est plus le même).
    await p.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}); await p.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  }
  p.off('console', onC); p.off('pageerror', onP); p.off('response', onR)
  const sansNom = m.elements.filter(e => !e.nom && e.tag !== 'input').length
  const pb = []
  if (!(st >= 200 && st < 400) && !/introuvable|nexiste|404/.test(u)) pb.push('statut ' + st)
  if (m.largeur > m.fenetre + 2) pb.push('debordement ' + m.largeur + ' > ' + m.fenetre)
  if (m.vide) pb.push('ecran vide')
  if (ms > 3000) pb.push('lent ' + ms + ' ms')
  if (m.imgKO) pb.push('images cassees ' + m.imgKO)
  if (err.length) pb.push('console : ' + [...new Set(err)].slice(0, 2).join(' / '))
  if (req.length) pb.push('requetes en echec : ' + [...new Set(req)].slice(0, 3).join(', '))
  const muets = clics.filter(c => !c.ok)
  if (muets.length) pb.push('boutons en echec : ' + muets.slice(0, 4).map(c => '« ' + c.nom + ' »' + (c.raison ? ' (' + c.raison + ')' : '')).join(' ; '))
  if (sansNom) pb.push(sansNom + ' element(s) sans nom (accessibilite)')
  ecrans.push({ n, url: u, statut: st, ms, elements: m.elements.length, boutonsCliques: clics.length, titre: m.titre, problemes: pb })
  if (pb.length) rouges.push({ n, url: u, problemes: pb })
  console.log(`${n} ${pb.length ? 'ROUGE' : 'vert '} ${u} | ${st} | ${ms} ms | ${m.elements.length} elements, ${clics.length} cliques${pb.length ? ' | ' + pb.join(' ; ') : ''}`)
  for (const l of m.liens) { const c = cle(l); if (!vus.has(c) && !file.includes(c)) file.push(c) }
}
await b.close()
const total = { ecrans: ecrans.length, elements: ecrans.reduce((s, x) => s + x.elements, 0), cliques: ecrans.reduce((s, x) => s + x.boutonsCliques, 0), rouges: rouges.length, ecrituresBloquees: ecrituresBloquees.length, secondes: Math.round((Date.now() - t0) / 1000) }
fs.writeFileSync(`${OUT}/rapport.json`, JSON.stringify({ base: BASE, appareil: APP, valable: true, sante, total, ecrans, rouges, ecrituresBloquees: [...new Set(ecrituresBloquees)] }, null, 1))
console.log(`FIN ${rouges.length ? 'ROUGE' : 'VERT'} : ${total.ecrans} ecrans, ${total.elements} elements lus, ${total.cliques} boutons cliques, ${total.rouges} ecran(s) rouge(s), ${total.ecrituresBloquees} ecriture(s) bloquee(s), ${total.secondes} s`)
process.exit(rouges.length ? 1 : 0)
