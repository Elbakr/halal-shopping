// Entrées extérieures -> courriel au fondateur (règle du 21/11/2026 20:42). build by Uxlab.ai
// Tout ce qui arrive de l'extérieur (votes et signalements, avis, photos, liens, ajouts de commerces, plaintes
// sur une photo, inscriptions d'organismes, certifications) part par courriel à contact@halal.shopping, que
// ImprovMX fait suivre vers la boîte Gmail du fondateur. Aucune clé : envoi SMTP direct au serveur de réception
// ImprovMX (port 25). Chaque entrée passe par la file « entrees_envoi » : rien ne se perd si l'envoi échoue,
// la minuterie réessaie toutes les 5 minutes (8 essais au plus), l'état est lisible par l'administrateur.
const COLS = {
  signals: "Vote sur un produit", place_signals: "Signalement sur un lieu", place_ratings: "Avis sur un lieu",
  added_places: "Commerce ajouté", contributions: "Contribution produit", place_media: "Photo d'un lieu",
  place_links: "Lien ajouté (réservation, avis…)", media_flags: "Plainte sur une photo", orgs: "Inscription d'un organisme",
  org_items: "Certification déposée par un organisme",
};
const DEST = "contact@halal.shopping", DEST_GMAIL = "elbazikarim@gmail.com";
function sec(n) { try { return String($app.findFirstRecordByData("hs_secrets", "name", n).get("value") || ""); } catch (e) { return ""; } }
const CACHE = ["id", "collectionId", "collectionName", "who", "device", "updated", "fp", "h"];
function texte(rec) {
  const col = rec.collection().name, lignes = [COLS[col] || col, "Reçu le : " + String(rec.get("created")).slice(0, 19) + " UTC", ""];
  const data = JSON.parse(JSON.stringify(rec));
  for (const k of Object.keys(data)) {
    if (CACHE.indexOf(k) >= 0 || data[k] === "" || data[k] === null || data[k] === 0 && k !== "w") continue;
    let v = data[k];
    if (["photo", "logo", "doc", "img", "media"].indexOf(k) >= 0 && v) v = "https://api.halal.shopping/api/files/" + rec.collection().id + "/" + rec.id + "/" + v;
    lignes.push(k + " : " + (typeof v === "object" ? JSON.stringify(v) : String(v)).slice(0, 800));
  }
  if (data.osm) lignes.push("", "Fiche du lieu : https://api.halal.shopping/l/" + data.osm);
  if (data.code) lignes.push("", "Fiche du produit : https://api.halal.shopping/p/" + data.code);
  lignes.push("", "Référence : " + col + "/" + rec.id, "build by Uxlab.ai");
  return lignes.join("\n");
}
function admins() { try { return JSON.parse($app.findFirstRecordByData("hs_secrets", "name", "admin_who").get("value") || "[]"); } catch (e) { return []; } }
// Mise en file : une ligne par entrée (clé unique col/id : jamais deux fois la même).
function enfiler(rec, historique) {
  const col = rec.collection().name;
  if (!COLS[col]) return false;
  if (admins().indexOf(String(rec.get("who") || "")) >= 0) return false;   // le fondateur lui-même n'est pas « l'extérieur »
  const ref = col + "/" + rec.id;
  try { $app.findFirstRecordByData("entrees_envoi", "ref", ref); return false; } catch (e) {}
  const r = new Record($app.findCollectionByNameOrId("entrees_envoi"));
  r.set("ref", ref); r.set("sujet", (historique ? "[historique] " : "") + "halal.shopping : " + (COLS[col] || col));
  r.set("texte", texte(rec)); r.set("historique", !!historique); r.set("essais", 0);
  $app.save(r);
  return true;
}
// L'envoi n'est actif que si le transport a été prouvé (op « test » réussie) : le port 25 sortant peut être fermé
// par l'hébergeur, et un envoi qui pend ne doit jamais bloquer le serveur.
function actif() { try { return $app.findFirstRecordByData("hs_secrets", "name", "entrees_transport").get("value") === "ok"; } catch (e) { return false; } }
function envoyer(r) {
  if ($os.getenv("HS_ESSAI")) { r.set("erreur", "serveur d'essai de la porte : aucun envoi"); return false; }
  const rk = sec("resend_cle"), rf = sec("resend_de");
  if (rk && rf) {
    try {
      const res = $http.send({ url: "https://api.resend.com/emails", method: "POST", timeout: 20,
        headers: { "Authorization": "Bearer " + rk, "Content-Type": "application/json" },
        body: JSON.stringify({ from: rf, to: [DEST_GMAIL], subject: r.get("sujet"), text: r.get("texte") }) });
      if (res.statusCode >= 200 && res.statusCode < 300) { r.set("envoye", new Date().toISOString().replace("T", " ")); r.set("erreur", ""); }
      else r.set("erreur", "resend " + res.statusCode + " " + String(res.raw || "").slice(0, 200));
    } catch (e) { r.set("erreur", String(e).slice(0, 300)); }
    r.set("essais", (r.get("essais") || 0) + 1); $app.save(r);
    return !r.get("erreur");
  }
  try {
    const m = new MailerMessage({ from: { address: "noreply@halal.shopping", name: "halal.shopping" }, to: [{ address: DEST }],
      subject: r.get("sujet"), text: r.get("texte"), html: "<pre style=\"font-family:system-ui,sans-serif;white-space:pre-wrap\">" + String(r.get("texte")).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</pre>" });
    $app.newMailClient().send(m);
    r.set("envoye", new Date().toISOString().replace("T", " ")); r.set("erreur", "");
  } catch (e) { r.set("erreur", String(e).slice(0, 300)); }
  r.set("essais", (r.get("essais") || 0) + 1);
  $app.save(r);
  return !r.get("erreur");
}
function passe() {
  let n = 0, ok = 0;
  const file = $app.findRecordsByFilter("entrees_envoi", "envoye = '' && essais < 8", "created", 30, 0);
  for (const r of file) { n++; if (envoyer(r)) ok++; }
  return { essayes: n, envoyes: ok };
}
// Administration : historique, test, état de la file.
function admin(e) {
  const U = require(`${__hooks}/hs_utils.js`);
  let b = {}; try { b = e.requestInfo().body || {}; } catch (x) {}
  const dev = String(b.device || e.request.url.query().get("device") || "");
  if (!U.isAdmin(dev)) return e.json(403, { message: "Admin only." });
  // le fondateur est reconnu à son identifiant hors de toute liste écrite dans le code
  const w = $security.sha256("m|" + dev), a = admins();
  if (a.indexOf(w) < 0) { a.push(w); let s; try { s = $app.findFirstRecordByData("hs_secrets", "name", "admin_who"); } catch (x) { s = new Record($app.findCollectionByNameOrId("hs_secrets")); s.set("name", "admin_who"); } s.set("value", JSON.stringify(a)); $app.save(s); }
  const op = String(b.op || e.request.url.query().get("op") || "etat");
  if (op === "test") {
    const r = new Record($app.findCollectionByNameOrId("entrees_envoi"));
    r.set("ref", "test/" + Date.now()); r.set("sujet", "[TEST] halal.shopping : envoi des entrées extérieures");
    r.set("texte", "Message d'essai : si vous le lisez, les entrées extérieures de halal.shopping arrivent bien dans cette boîte.\nbuild by Uxlab.ai"); r.set("essais", 0);
    $app.save(r); const ok = envoyer(r);
    let t; try { t = $app.findFirstRecordByData("hs_secrets", "name", "entrees_transport"); } catch (x) { t = new Record($app.findCollectionByNameOrId("hs_secrets")); t.set("name", "entrees_transport"); }
    t.set("value", ok ? "ok" : "ko"); $app.save(t);
    return e.json(ok ? 200 : 502, { ok: ok, erreur: r.get("erreur") });
  }
  if (op === "lien_depot") {
    const j = $security.randomString(40);
    let t; try { t = $app.findFirstRecordByData("hs_secrets", "name", "depot_jeton"); } catch (x) { t = new Record($app.findCollectionByNameOrId("hs_secrets")); t.set("name", "depot_jeton"); }
    t.set("value", JSON.stringify({ sha: $security.sha256(j), fin: Date.now() + 864e5 })); $app.save(t);
    return e.json(200, { jeton: j, fin: "24 h", usage: "POST /api/hs/depot {jeton, resend_cle, resend_de} — une seule fois" });
  }
  if (op === "historique") {
    let n = 0;
    for (const col of Object.keys(COLS)) {
      let recs = []; try { recs = $app.findRecordsByFilter(col, "id != ''", "created", 2000, 0); } catch (x) { continue; }
      for (const rec of recs) if (enfiler(rec, true)) n++;
    }
    return e.json(200, { en_file: n, passe: actif() ? passe() : "transport non prouvé : rien envoyé" });
  }
  if (op === "passe") return e.json(200, actif() ? passe() : { transport: "non prouvé" });
  const rows = $app.findRecordsByFilter("entrees_envoi", "id != ''", "-created", 200, 0);
  return e.json(200, { total: rows.length, non_envoyes: rows.filter((r) => !r.get("envoye")).length,
    lignes: rows.map((r) => ({ ref: r.get("ref"), sujet: r.get("sujet"), envoye: r.get("envoye"), essais: r.get("essais"), erreur: r.get("erreur"), texte: op === "detail" ? r.get("texte") : undefined })) });
}
// Dépôt à usage unique (sans clé admin) : le cerveau dépose la clé Resend déjà existante et l'adresse d'expédition
// vérifiée. Le jeton expire en 24 h et s'efface au premier usage. Puis un essai réel est envoyé.
function depot(e) {
  let b = {}; try { b = e.requestInfo().body || {}; } catch (x) {}
  let d = {}; try { d = JSON.parse(sec("depot_jeton") || "{}"); } catch (x) {}
  if (!d.sha || Date.now() > d.fin || $security.sha256(String(b.jeton || "")) !== d.sha) return e.json(403, { message: "refuse" });
  const cle = String(b.resend_cle || "").trim(), de = String(b.resend_de || "").trim();
  if (!/^re_[A-Za-z0-9_]{10,}$/.test(cle) || !/@/.test(de)) return e.json(400, { message: "resend_cle (re_...) et resend_de (adresse vérifiée) attendus" });
  for (const [n, v] of [["resend_cle", cle], ["resend_de", de], ["depot_jeton", ""]]) {
    let t; try { t = $app.findFirstRecordByData("hs_secrets", "name", n); } catch (x) { t = new Record($app.findCollectionByNameOrId("hs_secrets")); t.set("name", n); }
    t.set("value", v); $app.save(t);
  }
  const r = new Record($app.findCollectionByNameOrId("entrees_envoi"));
  r.set("ref", "test/" + Date.now()); r.set("sujet", "[TEST] halal.shopping : envoi des entrées extérieures");
  r.set("texte", "Message d'essai : les entrées extérieures de halal.shopping arrivent dans cette boîte.\nbuild by Uxlab.ai"); r.set("essais", 0); $app.save(r);
  const ok = envoyer(r);
  let t; try { t = $app.findFirstRecordByData("hs_secrets", "name", "entrees_transport"); } catch (x) { t = new Record($app.findCollectionByNameOrId("hs_secrets")); t.set("name", "entrees_transport"); }
  t.set("value", ok ? "ok" : "ko"); $app.save(t);
  return e.json(ok ? 200 : 502, { ok: ok, erreur: r.get("erreur") });
}
module.exports = { COLS, enfiler, passe, admin, actif, depot };
