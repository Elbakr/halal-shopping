// TripAdvisor rating of a venue, through the official Terra API (https://docs.terra.tripadvisor.com).
// The key stays on the server. The listing comes from the TripAdvisor link added to the venue (…-d123456-…): no
// searches, which are billed per listing returned. TripAdvisor allows keeping only the listing ID, so the rating is
// read live each time a venue page asks for it, within a monthly cap (each read is billed: about $0.015).
const LIMIT = 600; // reads per month: at most about $9
const BASE = "https://terra.tripadvisor.com/api/";
const LOC = { fr: "fr-FR", nl: "nl-NL", en: "en-US", de: "de-DE", es: "es-ES", pt: "pt-PT", tr: "tr-TR", ar: "ar", id: "id-ID", ms: "en-MY", ru: "ru-RU", zh: "zh-CN", ja: "ja-JP", hi: "en-IN", bn: "en-IN", ur: "en-IN" };
const U = () => require(`${__hooks}/hs_utils.js`);

function secret(name) { try { return $app.findFirstRecordByFilter("hs_secrets", "name = {:n}", { n: name }).get("value") || ""; } catch (x) { return ""; } }
function month() { return new Date().toISOString().slice(0, 7); }
function spend(k) { // count reads; false when the month's cap is reached
  let r; try { r = $app.findFirstRecordByFilter("ta_usage", "month = {:m}", { m: month() }); } catch (x) { r = new Record($app.findCollectionByNameOrId("ta_usage")); r.set("month", month()); r.set("n", 0); }
  if (r.get("n") + k > LIMIT) return false;
  r.set("n", r.get("n") + k); $app.save(r); return true;
}
function call(method, path, key, body) {
  const res = $http.send({ url: BASE + path, method: method, timeout: 8, body: body ? JSON.stringify(body) : "",
    headers: { "X-API-Key": key, accept: "application/json", "content-type": "application/json" } });
  if (res.statusCode < 200 || res.statusCode > 299) throw new Error("TripAdvisor " + res.statusCode + " " + String(res.raw || "").slice(0, 300));
  return res.json;
}

function lookup(e) {
  const q = e.request.url.query();
  const osm = String(q.get("osm") || ""), lang = String(q.get("lang") || "fr").replace(/[^a-z]/g, "").slice(0, 2) || "fr";
  const dbg = U().isAdmin(String(q.get("device") || ""));
  if (!/^[nwr]\d{1,20}$/.test(osm)) return e.json(400, { message: "Bad request." });
  const key = secret("tripadvisor");
  if (!key) return e.json(200, { none: true });
  let link = null; try { link = $app.findRecordsByFilter("place_links", "osm = {:o} && platform = 'tripadvisor'", "-w", 1, 0, { o: osm })[0]; } catch (x) {}
  const m = link ? String(link.get("url")).match(/-d(\d+)-/) : null;
  if (!m) return e.json(200, { none: true });
  const id = m[1];
  let c; try { c = $app.findFirstRecordByFilter("ta_cache", "osm = {:o}", { o: osm }); } catch (x) { c = null; }
  if (!c) { c = new Record($app.findCollectionByNameOrId("ta_cache")); c.set("osm", osm); }
  try {
    if (c.get("ta") !== id || !c.get("al")) { // put the listing on our allowlist (free), once
      call("POST", "allowlist", key, { allowlist: [parseInt(id, 10)], operation_type: "APPEND" });
      c.set("ta", id); c.set("al", true); $app.save(c);
    }
    if (!spend(1)) return e.json(200, { none: true, cap: true });
    const d = call("GET", "locations/" + id + "?version=1&locale=" + (LOC[lang] || "en-US"), key);
    const o = (d.traveler_ratings || {}).overall || {};
    if (!o.rating) return e.json(200, { none: true });
    e.response.header().set("Cache-Control", "no-store");
    return e.json(200, { rating: o.rating, n: o.count || 0, img: o.icon_url || "", url: ((d.urls || {}).tripadvisor || {}).main || link.get("url") });
  } catch (x) {
    if (dbg) return e.json(200, { error: String(x).slice(0, 400) });
    return e.json(200, { none: true });
  }
}

// Administrator: store a key (TripAdvisor...) without anyone being able to read it back; say which keys are set.
function setSecret(e) {
  let b = {}; try { b = e.requestInfo().body || {}; } catch (x) {}
  if (!U().isAdmin(String(b.device || ""))) return e.json(403, { message: "Admin only." });
  const name = String(b.name || ""); if (["tripadvisor"].indexOf(name) < 0) return e.json(400, { message: "Unknown key." });
  let r; try { r = $app.findFirstRecordByFilter("hs_secrets", "name = {:n}", { n: name }); } catch (x) { r = new Record($app.findCollectionByNameOrId("hs_secrets")); r.set("name", name); }
  r.set("value", String(b.value || "").trim().slice(0, 500)); $app.save(r);
  return e.json(200, { ok: true });
}
function secrets(e) {
  if (!U().isAdmin(e.request.url.query().get("device") || "")) return e.json(403, { message: "Admin only." });
  let used = 0; try { used = $app.findFirstRecordByFilter("ta_usage", "month = {:m}", { m: month() }).get("n"); } catch (x) {}
  return e.json(200, { tripadvisor: !!secret("tripadvisor"), used: used, limit: LIMIT });
}

module.exports = { lookup: lookup, setSecret: setSecret, secrets: secrets };
