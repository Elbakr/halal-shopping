// PORTE — cliquet des rouges connus. build by Uxlab.ai
// Usage : node porte.js <rouges-connus.json> <verdict.json> <resultats.json> [resultats2.json ...] [--serrer]
// Un écran est rouge s'il est rouge dans TOUS les passages donnés (un raté isolé du réseau ne bloque pas).
// Rouge nouveau (absent de la liste des rouges connus) => porte fermée (code 1).
// Rouge connu redevenu vert => retiré de la liste avec --serrer : le cliquet ne recule jamais.
const fs = require('fs');
const args = process.argv.slice(2), serrer = args.includes('--serrer');
const [RC, VERDICT, ...FILES] = args.filter(a => a !== '--serrer');
const lire = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const connus = lire(RC) || [];
const passages = FILES.map(lire);
if (!passages.length || passages.some(p => !Array.isArray(p) || !p.length)) {
  fs.writeFileSync(VERDICT, JSON.stringify({ verdict: 'ROUGE', raison: 'résultats absents ou illisibles (test planté)', nouveaux: [{ cle: 'test|plantage', note: 'aucun résultat' }] }, null, 1));
  console.log('PORTE ROUGE : test planté, aucun résultat'); process.exit(1);
}
const cle = r => r.profil + '|' + r.ecran;
const rougesDe = p => new Map(p.filter(r => !r.vert).map(r => [cle(r), r]));
const sets = passages.map(rougesDe);
const rouges = [...sets[sets.length - 1].entries()].filter(([k]) => sets.every(s => s.has(k)));
const nouveaux = rouges.filter(([k]) => !connus.includes(k)).map(([k, r]) => ({ cle: k, note: r.note, erreurs: r.erreurs, echecs: r.echecs }));
const vus = new Set(rouges.map(([k]) => k));
const gueris = connus.filter(k => !vus.has(k));
if (serrer && gueris.length) fs.writeFileSync(RC, JSON.stringify(connus.filter(k => vus.has(k)), null, 1) + '\n');
const total = passages[passages.length - 1].length;
const v = { verdict: nouveaux.length ? 'ROUGE' : 'VERT', ecrans: total, rouges: rouges.length, nouveaux, connus: connus.filter(k => vus.has(k)), gueris, passages: passages.length, heure: new Date().toISOString() };
fs.writeFileSync(VERDICT, JSON.stringify(v, null, 1));
console.log(`PORTE ${v.verdict} : ${total} écrans, ${rouges.length} rouge(s) dont ${nouveaux.length} nouveau(x)` + (nouveaux.length ? ' : ' + nouveaux.map(n => n.cle + ' (' + (n.note || '').slice(0, 90) + ')').join(' ; ') : '') + (gueris.length ? ` ; ${gueris.length} guéri(s)` + (serrer ? ' retiré(s) du cliquet' : '') : ''));
process.exit(nouveaux.length ? 1 : 0);
