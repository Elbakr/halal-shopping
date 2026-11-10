// Shared helpers for halal.shopping hooks (required from inside each handler: PocketBase runs handlers in isolation).
//
// Who contributes:
//   fp     = hash of the visitor's network address and browser, never stored in clear. One vote per person and per answer,
//            even in private browsing where the local device id is lost on every visit.
//   device = random id kept in the browser. Admin devices are listed below by their SHA-256 only (the repository is public).
// Weight of a vote (w), growing with real, spread-out activity so that a burst of clicks in one afternoon is not enough:
//   Éclaireur  1 contribution            -> 1
//   Guide      10 contributions, 2 days  -> 2
//   Sentinelle 30 contributions, 5 days  -> 5
//   Référent   100 contributions, 10 days -> 10
//   Administrateur                        -> 10
const ADMIN = ["b8d4da1a2a44ed6b921a72713c7fd539ce9e1835f0d70e6c932d84ccfd2469d5"];
const OPP = { seen: "notseen", notseen: "seen", confirm: "nothalal", nothalal: "confirm", alcohol: "noalcohol", noalcohol: "alcohol" };
const LEVELS = [[100, 10, 10], [30, 5, 5], [10, 2, 2], [1, 1, 1]]; // [contributions, days, weight]

function agent(e) {
  try { if (e.request) return e.request.header.get("User-Agent") || ""; } catch (x) {}
  try { return e.requestInfo().headers["user_agent"] || ""; } catch (x) { return ""; }
}
function address(e) {
  try { const ip = e.realIP(); if (ip) return ip; } catch (x) {}
  try { return String(e.requestInfo().headers["x_forwarded_for"] || "").split(",")[0].trim(); } catch (x) { return ""; }
}
// Empty when the visitor's address cannot be read: never fingerprint on the browser alone (identical phones would collide).
function fp(e) {
  const ip = address(e);
  if (!ip || ip.indexOf("127.") === 0 || ip === "::1") return "";
  return $security.sha256("hs1|" + ip + "|" + agent(e)).substring(0, 32);
}
function isAdmin(device) {
  return !!device && ADMIN.indexOf($security.sha256(String(device))) >= 0;
}
function who(device) { return device ? $security.sha256("m|" + String(device)) : ""; }
function bodyDevice(e) { try { return String((e.requestInfo().body || {}).device || ""); } catch (x) { return ""; } }
function activity(device, f) {
  const r = new DynamicModel({ n: 0, d: 0 });
  $app.db().newQuery(
    "SELECT COUNT(*) AS n, COUNT(DISTINCT substr(created, 1, 10)) AS d FROM (" +
    " SELECT created FROM signals WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM place_signals WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM place_ratings WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM added_places WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM contributions WHERE fp = {:f}" +
    " UNION ALL SELECT created FROM place_media WHERE who = {:wh}" +
    " UNION ALL SELECT created FROM place_links WHERE who = {:wh})"
  ).bind({ dv: device || "-", f: f, wh: who(device) || "-" }).one(r);
  return { n: r.n, d: r.d };
}
function level(a, admin) {
  if (admin) return { level: 5, w: 10 };
  for (let i = 0; i < LEVELS.length; i++) {
    if (a.n >= LEVELS[i][0] && a.d >= LEVELS[i][1]) return { level: 4 - i, w: LEVELS[i][2] };
  }
  return { level: 0, w: 1 };
}

// Before a contribution is saved: fingerprint, weight, and the person's opposite answer is withdrawn.
function metres(a, b, c, d) {
  const R = 6371000, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180;
  const h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) * Math.sin(y / 2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
const DOMAINS = {
  ubereats: /(^|\.)ubereats\.com$/, deliveroo: /(^|\.)deliveroo\.[a-z.]+$/,
  takeaway: /(^|\.)(takeaway\.com|thuisbezorgd\.nl|lieferando\.(de|at)|just-eat\.[a-z.]+|justeat\.it|pyszne\.pl)$/,
  booking: /./, instagram: /(^|\.)instagram\.com$/, facebook: /(^|\.)(facebook|fb)\.com$/, tiktok: /(^|\.)tiktok\.com$/, website: /./,
};
// Photos and links: author hash, weight, distance to the venue; links checked against their platform, one per person.
function prepareProof(e, name) {
  const rec = e.record, dev = bodyDevice(e), wh = who(dev);
  if (!wh) throw new BadRequestError("Missing contributor.");
  rec.set("who", wh);
  const lv = level(activity(dev, fp(e) || "-"), isAdmin(dev));
  rec.set("w", lv.w);
  if (name === "place_media") {
    let d = -1;
    try {
      const b = e.requestInfo().body || {};
      const la = parseFloat(b.lat), lo = parseFloat(b.lon), vla = parseFloat(b.vlat), vlo = parseFloat(b.vlon);
      if (isFinite(la) && isFinite(lo) && isFinite(vla) && isFinite(vlo)) d = metres(la, lo, vla, vlo);
    } catch (x) {}
    rec.set("dist", d);
    const n = $app.findRecordsByFilter(name, "who = {:wh} && created > {:since}", "", 61, 0, { wh: wh, since: new Date(Date.now() - 86400000).toISOString().replace("T", " ") });
    if (n.length >= 60 && !isAdmin(dev)) throw new BadRequestError("Too many photos today.");
  }
  if (name === "place_links") {
    const url = String(rec.get("url") || ""), m = url.match(/^https?:\/\/([^\/?#]+)/i);
    const host = m ? m[1].toLowerCase() : "";
    if (!host || !DOMAINS[rec.get("platform")] || !DOMAINS[rec.get("platform")].test(host)) throw new BadRequestError("Link does not match the platform.");
    const olds = $app.findRecordsByFilter(name, "osm = {:o} && platform = {:p} && who = {:wh}", "", 10, 0, { o: rec.get("osm"), p: rec.get("platform"), wh: wh });
    for (let i = 0; i < olds.length; i++) $app.delete(olds[i]);
  }
  if (name === "media_flags") {
    const had = $app.findRecordsByFilter(name, "media = {:m} && who = {:wh}", "", 1, 0, { m: rec.get("media"), wh: wh });
    if (had.length) throw new BadRequestError("Already counted.");
  }
}
function prepare(e) {
  const rec = e.record, name = e.collection.name;
  if (name === "place_media" || name === "place_links" || name === "media_flags") return prepareProof(e, name);
  const f = fp(e);
  if (f) rec.set("fp", f);
  if (name === "place_ratings") {
    const had = $app.findRecordsByFilter(name, "osm = {:k} && (fp = {:f} || device = {:d})", "", 1, 0, { k: rec.get("osm"), f: f || "-", d: rec.get("device") || "-" });
    if (had.length) throw new BadRequestError("Already rated.");
    return;
  }
  if (name !== "signals" && name !== "place_signals") return;
  const key = name === "signals" ? "code" : "osm", device = rec.get("device");
  // The same person giving the same answer twice (new browser id, private browsing...) is one answer.
  const same = $app.findRecordsByFilter(name, key + " = {:k} && kind = {:o} && (fp = {:f} || device = {:d})", "", 1, 0,
    { k: rec.get(key), o: rec.get("kind"), f: f || "-", d: device || "-" });
  if (same.length) throw new BadRequestError("Already counted.");
  const opp = OPP[rec.get("kind")];
  if (opp) {
    const olds = $app.findRecordsByFilter(name, key + " = {:k} && kind = {:o} && (fp = {:f} || device = {:d})", "", 20, 0,
      { k: rec.get(key), o: opp, f: f || "-", d: device || "-" });
    for (let i = 0; i < olds.length; i++) $app.delete(olds[i]);
  }
  rec.set("w", level(activity(device, f || "-"), isAdmin(device)).w);
}

// A person withdraws one of their own answers, recognised by device id or by fingerprint.
function withdraw(e) {
  const b = new DynamicModel({ coll: "", key: "", kind: "", device: "", mins: 0 });
  e.bindBody(b);
  if (b.coll === "place_media" || b.coll === "place_links" || b.coll === "media_flags") {
    const wh = who(b.device);
    if (!wh || !b.key || b.key.length > 24) throw new BadRequestError("Invalid request.");
    const k2 = b.coll === "place_media" ? "id" : b.coll === "media_flags" ? "media" : "osm";
    // The administrator can remove any photo or link (moderation); others only their own.
    let f2 = k2 + " = {:key}" + (isAdmin(b.device) ? "" : " && who = {:wh}"); const p2 = { key: b.key, wh: wh };
    if (b.coll === "place_links") { f2 += " && platform = {:kind}"; p2.kind = b.kind; }
    const recs2 = $app.findRecordsByFilter(b.coll, f2, "", 20, 0, p2);
    for (let i = 0; i < recs2.length; i++) $app.delete(recs2[i]);
    return { removed: recs2.length };
  }
  const keys = { signals: "code", place_signals: "osm", place_ratings: "osm" };
  const k = keys[b.coll];
  if (!k || !b.key || b.key.length > 24) throw new BadRequestError("Invalid request.");
  let filter = k + " = {:key} && (fp = {:f} || device = {:d})";
  const params = { key: b.key, f: fp(e) || "-", d: b.device || "-" };
  // Moderation: the administrator removes the answers given on one item during the last minutes (e.g. a test).
  if (isAdmin(b.device) && b.mins > 0 && b.mins <= 1440) {
    filter = k + " = {:key} && created >= {:since}";
    params.since = new Date(Date.now() - b.mins * 60000).toISOString().replace("T", " ");
  }
  if (b.coll !== "place_ratings") { filter += " && kind = {:kind}"; params.kind = b.kind; }
  const recs = $app.findRecordsByFilter(b.coll, filter, "", 20, 0, params);
  for (let i = 0; i < recs.length; i++) $app.delete(recs[i]);
  return { removed: recs.length };
}

// The visitor's own level, as the server counts it.
function me(e) {
  const device = e.request.url.query().get("device") || "", f = fp(e);
  const a = activity(device, f || "-"), admin = isAdmin(device), l = level(a, admin);
  return { n: a.n, days: a.d, level: l.level, w: l.w, admin: admin, known: !!f };
}

module.exports = { prepare: prepare, withdraw: withdraw, me: me, isAdmin: isAdmin, bodyDevice: bodyDevice };
