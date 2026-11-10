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
function activity(device, f) {
  const r = new DynamicModel({ n: 0, d: 0 });
  $app.db().newQuery(
    "SELECT COUNT(*) AS n, COUNT(DISTINCT substr(created, 1, 10)) AS d FROM (" +
    " SELECT created FROM signals WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM place_signals WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM place_ratings WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM added_places WHERE device = {:dv} OR fp = {:f}" +
    " UNION ALL SELECT created FROM contributions WHERE fp = {:f})"
  ).bind({ dv: device || "-", f: f }).one(r);
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
function prepare(e) {
  const rec = e.record, name = e.collection.name, f = fp(e);
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
  const b = new DynamicModel({ coll: "", key: "", kind: "", device: "" });
  e.bindBody(b);
  const keys = { signals: "code", place_signals: "osm", place_ratings: "osm" };
  const k = keys[b.coll];
  if (!k || !b.key || b.key.length > 24) throw new BadRequestError("Invalid request.");
  let filter = k + " = {:key} && (fp = {:f} || device = {:d})";
  const params = { key: b.key, f: fp(e) || "-", d: b.device || "-" };
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

module.exports = { prepare: prepare, withdraw: withdraw, me: me };
