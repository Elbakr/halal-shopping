// TripAdvisor rating of a venue (official Content API). The key stays on the server; the page only gets
// the rating, the number of reviews, TripAdvisor's rating image and the link to the listing, to show with its logo.
const LIMIT = 1600;        // listings per month: 1,000 free, then about $0.015 each (cap near $9)
const FRESH = 30 * 24 * 3600e3; // a rating is asked again after 30 days
const API = "https://api.content.tripadvisor.com/api/v1/location/";
const U = () => require(`${__hooks}/hs_utils.js`);

function secret(name) { try { return $app.findFirstRecordByFilter("hs_secrets", "name = {:n}", { n: name }).get("value") || ""; } catch (x) { return ""; } }
function month() { return new Date().toISOString().slice(0, 7); }
function spend(k) { // count calls; false when the month's allowance is used up
  let r; try { r = $app.findFirstRecordByFilter("ta_usage", "month = {:m}", { m: month() }); } catch (x) { r = new Record($app.findCollectionByNameOrId("ta_usage")); r.set("month", month()); r.set("n", 0); }
  if (r.get("n") + k > LIMIT) return false;
  r.set("n", r.get("n") + k); $app.save(r); return true;
}
function get(url) {
  const res = $http.send({ url: url, method: "GET", timeout: 8, headers: { accept: "application/json", Referer: "https://halal.shopping/" } });
  if (res.statusCode !== 200) throw new Error("TripAdvisor " + res.statusCode);
  return res.json;
}

function lookup(e) {
  const q = e.request.url.query();
  const osm = String(q.get("osm") || ""), name = String(q.get("name") || "").slice(0, 80);
  const lat = parseFloat(q.get("lat")), lon = parseFloat(q.get("lon")), lang = String(q.get("lang") || "fr").replace(/[^a-z]/g, "").slice(0, 2) || "fr";
  if (!/^[nwr]\d{1,20}$/.test(osm) || !name || isNaN(lat) || isNaN(lon)) return e.json(400, { message: "Bad request." });
  const key = secret("tripadvisor");
  if (!key) return e.json(200, { none: true });
  let c; try { c = $app.findFirstRecordByFilter("ta_cache", "osm = {:o}", { o: osm }); } catch (x) { c = null; }
  const age = c ? Date.now() - new Date(String(c.get("updated")).replace(" ", "T")).getTime() : 1e15;
  const out = (r) => e.json(200, r && r.get("ta") ? { rating: r.get("rating"), n: r.get("n"), url: r.get("url"), img: r.get("img") } : { none: true });
  if (c && (c.get("ta") ? age < FRESH : age < 3 * FRESH)) return out(c);
  try {
    if (!c) { c = new Record($app.findCollectionByNameOrId("ta_cache")); c.set("osm", osm); }
    let id = c.get("ta");
    if (!id) {
      // TripAdvisor bills every listing a response returns: a search returns up to 10, so we never search.
      // The listing comes from the TripAdvisor link members or the restaurant added to the venue (…-d123456-…).
      let link = null; try { link = $app.findRecordsByFilter("place_links", "osm = {:o} && platform = 'tripadvisor'", "-w", 1, 0, { o: osm })[0]; } catch (x) {}
      const m = link ? String(link.get("url")).match(/-d(\d+)-/) : null;
      if (!m) { if (c.id) return out(null); return e.json(200, { none: true }); }
      id = m[1]; c.set("ta", id);
    }
    if (!spend(1)) { $app.save(c); return out(c.get("url") ? c : null); }
    const d = get(API + id + "/details?key=" + key + "&language=" + lang + "&currency=EUR");
    c.set("rating", parseFloat(d.rating || 0)); c.set("n", parseInt(d.num_reviews || 0, 10)); c.set("url", d.web_url || ""); c.set("img", d.rating_image_url || "");
    $app.save(c);
    return out(c);
  } catch (x) {
    return out(c && c.get("url") ? c : null);
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
