// Audience without cookies, without storage in the browser, without third party (build by Uxlab.ai).
// A visitor = a salted hash of (address, browser) for one day; the salt is random, changes every day and is deleted
// the next night with the hashes: nothing allows following a person from one day to the next, nor finding their address.
// Robots and automated browsers are not counted (the page does not even send the signal under automation).
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|python|curl|wget|node-fetch|axios|go-http|java\/|phantom|selenium|playwright|puppeteer|monitor|uptime/i;
const CONTRIB = ["signals", "place_signals", "place_ratings", "added_places", "contributions", "place_media", "place_links", "media_flags", "org_items", "orgs"];
function day(offset) { return new Date(Date.now() + (offset || 0) * 864e5).toISOString().slice(0, 10); }
function salt(d) {
  const name = "aud_" + d;
  try { return $app.findFirstRecordByData("hs_secrets", "name", name).get("value"); } catch (e) {}
  try { const r = new Record($app.findCollectionByNameOrId("hs_secrets")); r.set("name", name); r.set("value", $security.randomString(40)); $app.save(r); return r.get("value"); }
  catch (e) { return $app.findFirstRecordByData("hs_secrets", "name", name).get("value"); }
}
function ensure(d) { $app.db().newQuery("INSERT OR IGNORE INTO audience (id, day, v, s, c, b) VALUES ({:id}, {:d}, 0, 0, 0, 0)").bind({ id: $security.randomString(15), d: d }).execute(); }
function inc(d, f) { ensure(d); $app.db().newQuery("UPDATE audience SET " + f + " = " + f + " + 1 WHERE day = {:d}").bind({ d: d }).execute(); }
function contributions(d) {
  let n = 0; const a = d + " 00:00:00.000Z", b = new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10) + " 00:00:00.000Z";
  for (const c of CONTRIB) {
    try { const r = new DynamicModel({ n: 0 }); $app.db().newQuery("SELECT count(*) AS n FROM " + c + " WHERE created >= {:a} AND created < {:b}").bind({ a: a, b: b }).one(r); n += r.n; } catch (e) {}
  }
  return n;
}
function hit(e) {
  const ua = String(e.request.header.get("User-Agent") || "");
  let ev = "v"; try { const b = e.requestInfo().body || {}; if (b.e === "s") ev = "s"; } catch (x) {}
  const d = day(0);
  if (!ua || BOT.test(ua)) { inc(d, "b"); return e.noContent(204); }
  const ip = String(e.request.header.get("X-Forwarded-For") || "").split(",").pop().trim() || e.realIP();
  const h = $security.sha256(salt(d) + "|" + ip + "|" + ua).slice(0, 40);
  const first = $app.db().newQuery("INSERT OR IGNORE INTO aud_seen (id, day, h, s) VALUES ({:id}, {:d}, {:h}, 0)").bind({ id: $security.randomString(15), d: d, h: h }).execute().rowsAffected() > 0;
  if (ev === "v") { if (first) inc(d, "v"); }
  else if ($app.db().newQuery("UPDATE aud_seen SET s = s + 1 WHERE day = {:d} AND h = {:h} AND s < 300").bind({ d: d, h: h }).execute().rowsAffected() > 0) {
    if (first) inc(d, "v");
    inc(d, "s");
  }
  return e.noContent(204);
}
// Read: the administrator (admin link) or the machine itself (deploy.sh), never the public.
function list(e) {
  const local = !e.request.header.get("X-Forwarded-For") && /^127\.0\.0\.1:|^\[::1\]:/.test(String(e.request.remoteAddr));
  if (!local && !require(`${__hooks}/hs_utils.js`).isAdmin(String(e.request.url.query().get("device") || ""))) return e.json(403, { message: "Admin only." });
  const rows = arrayOf(new DynamicModel({ day: "", v: 0, s: 0, c: 0, b: 0 }));
  $app.db().newQuery("SELECT day, v, s, c, b FROM audience ORDER BY day DESC LIMIT 90").all(rows);
  const out = rows.map((r) => ({ day: r.day, visiteurs: r.v, recherches: r.s, contributions: r.day === day(0) ? contributions(r.day) : r.c, robots: r.b }));
  return e.json(200, { note: "Sans cookie, sans stockage dans le navigateur ; robots exclus. Contributions du jour : en cours.", jours: out });
}
// Every night: final contribution count for yesterday, then the hashes and the old salts are deleted.
function nightly() {
  const y = day(-1); ensure(y);
  $app.db().newQuery("UPDATE audience SET c = {:c} WHERE day = {:d}").bind({ c: contributions(y), d: y }).execute();
  $app.db().newQuery("DELETE FROM aud_seen WHERE day < {:d}").bind({ d: day(0) }).execute();
  $app.db().newQuery("DELETE FROM hs_secrets WHERE name LIKE 'aud_%' AND name < {:n}").bind({ n: "aud_" + day(0) }).execute();
}
module.exports = { hit, list, nightly };
