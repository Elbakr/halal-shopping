// Organisations (certification bodies, authorities, mosques, federations): registration, private space, review by halal.shopping.
const KINDS = ["certifier", "authority", "mosque", "federation", "association", "other"];
const U = () => require(`${__hooks}/hs_utils.js`);

function body(e) { try { return e.requestInfo().body || {}; } catch (x) { return {}; } }
function str(v, n) { return String(v == null ? "" : v).trim().slice(0, n); }
function orgJSON(r, full) {
  const o = { id: r.id, name: r.get("name"), kind: r.get("kind"), country: r.get("country"), website: r.get("website"), regno: r.get("regno"),
    about: r.get("about"), logo: r.get("logo"), status: r.get("status"), created: String(r.get("created")) };
  if (full) { o.email = r.get("email"); o.phone = r.get("phone"); o.contact = r.get("contact"); o.lang = r.get("lang"); }
  return o;
}
function byKey(e) {
  const k = str(e.request.header.get("X-Org-Key"), 64);
  if (k.length < 24) return null;
  try { return $app.findFirstRecordByFilter("orgs", "key = {:k}", { k: k }); } catch (x) { return null; }
}

function register(e) {
  const b = body(e);
  const name = str(b.name, 120), kind = str(b.kind, 20), email = str(b.email, 120).toLowerCase();
  if (name.length < 2 || KINDS.indexOf(kind) < 0 || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) throw new BadRequestError("Missing name, type or email.");
  let web = str(b.website, 200);
  if (web && !/^https?:\/\//i.test(web)) web = "https://" + web;
  const recent = new DynamicModel({ n: 0 });
  $app.db().newQuery("SELECT COUNT(*) AS n FROM orgs WHERE status = 'pending' AND created > datetime('now', '-1 day')").one(recent);
  if (recent.n > 60) throw new BadRequestError("Too many requests today, try again tomorrow.");
  const r = new Record($app.findCollectionByNameOrId("orgs"));
  const key = $security.randomStringWithAlphabet(32, "abcdefghijklmnopqrstuvwxyz0123456789");
  r.set("name", name); r.set("kind", kind); r.set("email", email);
  r.set("country", str(b.country, 2).toUpperCase().replace(/[^A-Z]/g, ""));
  if (web) r.set("website", web);
  r.set("phone", str(b.phone, 30)); r.set("contact", str(b.contact, 80)); r.set("regno", str(b.regno, 80));
  r.set("about", str(b.about, 600)); r.set("lang", str(b.lang, 5)); r.set("status", "pending"); r.set("key", key);
  $app.save(r);
  return e.json(200, { id: r.id, key: key });
}

function me(e) {
  const r = byKey(e);
  if (!r) return e.json(404, { message: "Unknown key." });
  const items = $app.findRecordsByFilter("org_items", "org = {:o}", "-created", 2000, 0, { o: r.id }).map((x) => ({
    id: x.id, target: x.get("target"), code: x.get("code"), label: x.get("label"), certno: x.get("certno"),
    until: String(x.get("until") || ""), scope: x.get("scope"), doc: x.get("doc"), active: x.get("active") }));
  return e.json(200, { org: orgJSON(r, true), items: items });
}

function adminList(e) {
  if (!U().isAdmin(e.request.url.query().get("device") || "")) return e.json(403, { message: "Admin only." });
  const list = $app.findRecordsByFilter("orgs", "id != ''", "-created", 500, 0).map((r) => {
    const o = orgJSON(r, true);
    const n = new DynamicModel({ n: 0 });
    $app.db().newQuery("SELECT COUNT(*) AS n FROM org_items WHERE org = {:o} AND active = 1").bind({ o: r.id }).one(n);
    o.items = n.n; return o;
  });
  return e.json(200, { orgs: list });
}

function review(e) {
  const b = body(e);
  if (!U().isAdmin(str(b.device, 64))) return e.json(403, { message: "Admin only." });
  const r = $app.findRecordById("orgs", str(b.id, 15));
  const out = { id: r.id };
  if (b.action === "newkey") {
    const key = $security.randomStringWithAlphabet(32, "abcdefghijklmnopqrstuvwxyz0123456789");
    r.set("key", key); out.key = key;
  } else {
    if (["pending", "verified", "rejected", "suspended"].indexOf(b.status) < 0) throw new BadRequestError("Bad status.");
    r.set("status", b.status);
  }
  $app.save(r);
  out.status = r.get("status");
  return e.json(200, out);
}

// An organisation edits its own card: status and key stay as halal.shopping set them.
function guardOrg(e) {
  const o = e.record.original();
  e.record.set("status", o.get("status"));
  e.record.set("key", o.get("key"));
}
// A new certification is active unless the organisation says otherwise.
function itemDefaults(e) {
  const b = body(e);
  if (b.active === undefined || b.active === "") e.record.set("active", true);
}

module.exports = { register: register, me: me, adminList: adminList, review: review, guardOrg: guardOrg, itemDefaults: itemDefaults };
