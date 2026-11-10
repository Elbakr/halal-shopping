// Share pages: rich previews on WhatsApp/Facebook/X and indexable pages for search engines.
// People are sent straight to the app; link-preview robots and search engines get a small HTML page.
var SITE = "https://halal.shopping/";
var IMG = SITE + "og.png";
var BOTS = /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|twitter|slack|discord|linkedin|skype|pinterest|embedly|preview|vkshare|quora|redditbot|applebot|bingpreview|google/i;
var TYPES = { r: "Restaurant", f: "Snack · fast-food", b: "Boucherie", s: "Commerce" };
var VIDS = { e120: ["iBNySB2jpVg", "Carmin E120 : le colorant fait d'insectes écrasés"], e441: ["6bYIow9pc6M", "Gélatine E441 : fabriquée à partir de peaux et d'os"],
  e904: ["iEkKwOWZS_E", "Gomme-laque E904 : la sécrétion d'insecte qui fait briller"], e920: ["ipTB2rgxQwk", "L-cystéine E920 : tirée de plumes et de poils"],
  e471: ["yk1Pfsuf83Y", "E471 : mono- et diglycérides, origine animale possible"] };

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function isBot(e) { var ua = ""; try { ua = e.request.header.get("User-Agent") || ""; } catch (x) {} return !ua || BOTS.test(ua); }
function page(e, o) {
  var h = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>" + esc(o.title) + "</title>" +
    '<meta name="description" content="' + esc(o.desc) + '"><link rel="canonical" href="' + esc(o.self) + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="halal.shopping">' +
    '<meta property="og:url" content="' + esc(o.self) + '"><meta property="og:title" content="' + esc(o.title) + '">' +
    '<meta property="og:description" content="' + esc(o.desc) + '"><meta property="og:image" content="' + esc(o.img || IMG) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' + (o.ld ? '<script type="application/ld+json">' + JSON.stringify(o.ld).replace(/</g, "\\u003c") + "</script>" : "") +
    '<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:24px 16px;background:#0f211b;color:#eef5f1}a{color:#5fd39a}.b{display:inline-block;margin-top:18px;padding:12px 18px;border-radius:10px;background:#5fd39a;color:#0f211b;font-weight:700;text-decoration:none}small{color:#9bb8ad}</style></head><body>' +
    "<p><a href=\"" + SITE + "\">halal.shopping</a></p><h1>" + esc(o.h1 || o.title) + "</h1>" + o.body +
    '<p><a class="b" href="' + esc(o.go) + '">Ouvrir sur halal.shopping</a></p><p><small>Informations issues d\'OpenStreetMap, d\'Open Food Facts et de la communauté. Vérifiez toujours sur place. build by Uxlab.ai</small></p></body></html>';
  e.response.header().set("Cache-Control", "public, max-age=3600");
  return e.html(200, h);
}
function readJSON(p) { try { return JSON.parse(toString($os.readFile(p))); } catch (x) { return null; } }

function place(e) {
  var id = e.request.pathValue("id") || "";
  var go = SITE + "#l" + id;
  if (/^u[a-z0-9]{15}$/.test(id)) return e.redirect(302, go);  // added by a member: the app shows it
  if (!/^[nwr]\d{1,20}$/.test(id)) return e.redirect(302, SITE);
  if (!isBot(e)) return e.redirect(302, go);
  var sh = readJSON("/var/www/data/ids/" + ("0" + id.slice(-2)).slice(-2) + ".json") || {};
  var r = sh[id];
  if (!r) return e.redirect(302, go);
  var st = r.rp ? "Réputé halal dans la communauté" : r.p === 3 ? "Enseigne : halal dans certains établissements seulement, à vérifier"
    : r.p === 1 ? (r.ch != null ? "Halal selon l'enseigne" : "Probablement halal, à confirmer") : "Déclaré halal sur OpenStreetMap";
  if (r.ch != null && !r.p) st = "Déclaré halal";
  var extra = [];
  if (r.mx) extra.push("supermarché mixte"); else if (r.al) extra.push("vend de l'alcool");
  if (r.dv) extra.push("livraison"); if (r.tk) extra.push("à emporter");
  var where = [[r.a, r.z].filter(Boolean).join(", "), r.c].filter(Boolean).join(" · ");
  var ty = TYPES[r.t] || "Commerce";
  var title = r.n + " — " + ty + (r.c ? " à " + r.c : "") + " | halal.shopping";
  var desc = st + (extra.length ? " · " + extra.join(", ") : "") + (where ? ". " + where : "") + ". Avis, photos du menu et liens de commande sur halal.shopping.";
  var ld = { "@context": "https://schema.org", "@type": r.t === "s" || r.t === "b" ? "Store" : "Restaurant", name: r.n, url: "https://api.halal.shopping/l/" + id,
    geo: { "@type": "GeoCoordinates", latitude: r.la, longitude: r.lo } };
  if (r.a || r.c) ld.address = { "@type": "PostalAddress", streetAddress: r.a || undefined, postalCode: r.z || undefined, addressLocality: r.c || undefined, addressCountry: r.cc || undefined };
  if (r.ph) ld.telephone = r.ph;
  if (r.h) ld.openingHours = r.h;
  var body = "<p><b>" + esc(st) + "</b>" + (extra.length ? " · " + esc(extra.join(", ")) : "") + "</p><p>" + esc(ty) + (r.k ? " · " + esc(r.k) : "") + "</p>" +
    (where ? "<p>" + esc(where) + "</p>" : "") + (r.h ? "<p>Horaires : " + esc(r.h) + "</p>" : "") + (r.ph ? "<p>Tél. " + esc(r.ph) + "</p>" : "");
  return page(e, { title: title, h1: r.n, desc: desc, self: "https://api.halal.shopping/l/" + id, go: go, body: body, ld: ld });
}

function product(e) {
  var code = e.request.pathValue("code") || "";
  if (!/^\d{8,14}$/.test(code)) return e.redirect(302, SITE);
  var go = SITE + "#p" + code;
  if (!isBot(e)) return e.redirect(302, go);
  var name = "", img = "", brand = "";
  try {
    var res = $http.send({ url: "https://world.openfoodfacts.org/api/v2/product/" + code + ".json?fields=product_name,product_name_fr,brands,image_front_url",
      method: "GET", timeout: 6, headers: { "User-Agent": "halal.shopping/1.0 (share preview)" } });
    var p = res.json && res.json.product;
    if (p) { name = p.product_name_fr || p.product_name || ""; brand = (p.brands || "").split(",")[0]; img = p.image_front_url || ""; }
  } catch (x) {}
  var label = (name || "Produit " + code) + (brand ? " (" + brand + ")" : "");
  return page(e, { title: label + " est-il halal ? | halal.shopping", h1: label + " est-il halal ?",
    desc: "Mention halal de la marque, additifs d'origine animale, alcool, gélatine : la réponse pour " + label + " en 2 secondes.",
    self: "https://api.halal.shopping/p/" + code, go: go, img: img || IMG,
    body: "<p>Code-barres " + esc(code) + ". Ouvrez la fiche pour voir le verdict, les additifs à risque et les alternatives.</p>" });
}

function additive(e) {
  var k = (e.request.pathValue("code") || "").toLowerCase();
  var v = VIDS[k];
  if (!v) return e.redirect(302, SITE);
  var go = SITE + "#a=" + k;
  if (!isBot(e)) return e.redirect(302, go);
  return page(e, { title: v[1] + " | halal.shopping", desc: "Regardez d'où vient " + k.toUpperCase() + " en vidéo, puis scannez vos produits pour l'éviter.",
    self: "https://api.halal.shopping/a/" + k, go: go, img: "https://i.ytimg.com/vi/" + v[0] + "/hqdefault.jpg",
    body: "<p>Vidéo : https://www.youtube.com/watch?v=" + esc(v[0]) + "</p>" });
}

function robots(e) {
  return e.string(200, "User-agent: *\nAllow: /l/\nAllow: /p/\nAllow: /a/\nDisallow: /api/\nDisallow: /_/\nSitemap: https://api.halal.shopping/sitemap.xml\n");
}

module.exports = { place: place, product: product, additive: additive, robots: robots };
