// Product search by name for the site. search.openfoodfacts.org (relevance ranking) does not allow browser calls
// from other sites, so the page asks us and we ask it.
function search(e) {
  const q = String(e.request.url.query().get("q") || "").trim().slice(0, 80);
  const lang = String(e.request.url.query().get("lang") || "fr").replace(/[^a-z]/g, "").slice(0, 3) || "fr";
  if (q.length < 2) return e.json(200, { hits: [] });
  const fields = "code,product_name,product_name_" + lang + ",product_name_fr,product_name_en,brands,image_front_small_url";
  try {
    const res = $http.send({
      url: "https://search.openfoodfacts.org/search?q=" + encodeURIComponent(q) + "&page_size=24&langs=" + lang + "&fields=" + fields,
      method: "GET", timeout: 8, headers: { "User-Agent": "halal.shopping/1.0 (search)" },
    });
    if (res.statusCode !== 200) return e.json(502, { hits: [] });
    e.response.header().set("Cache-Control", "public, max-age=600");
    return e.json(200, { hits: (res.json && res.json.hits) || [] });
  } catch (x) {
    return e.json(502, { hits: [] });
  }
}
module.exports = { search: search };
