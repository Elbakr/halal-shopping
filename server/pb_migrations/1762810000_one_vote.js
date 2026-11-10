/// <reference path="../pb_data/types.d.ts" />
// One vote per person and per answer (fingerprint fp), weight of each vote (w), and counts that read them.
// Votes recorded before this change have no fingerprint: each answer they hold counts once, however many there were.
migrate((app) => {
  const add = (name, withWeight, uniq) => {
    try {
      const c = app.findCollectionByNameOrId(name);
      if (!c.fields.getByName("fp")) c.fields.add(new TextField({ name: "fp", max: 64, hidden: true }));
      if (withWeight && !c.fields.getByName("w")) c.fields.add(new NumberField({ name: "w", min: 0, max: 100 }));
      if (uniq) c.addIndex(uniq[0], true, uniq[1], "fp != ''");
      app.save(c);
    } catch (e) { console.log("error: one vote " + name + ":", e); }
  };
  add("signals", true, ["idx_signals_fp", "code, kind, fp"]);
  add("place_signals", true, ["idx_place_signals_fp", "osm, kind, fp"]);
  add("place_ratings", false, ["idx_place_ratings_fp", "osm, fp"]);
  add("added_places", false, null);
  add("contributions", false, null);

  // n: people, wt: weight. A pre-fingerprint answer counts as one person of weight 1.
  const legacy = "MAX(CASE WHEN fp = '' OR fp IS NULL THEN 1 ELSE 0 END)";
  const people = "(COUNT(DISTINCT CASE WHEN fp != '' THEN fp END) + " + legacy + ")";
  const weight = "(SUM(CASE WHEN fp != '' THEN (CASE WHEN w > 0 THEN w ELSE 1 END) ELSE 0 END) + " + legacy + ")";
  try {
    const v = app.findCollectionByNameOrId("place_counts");
    v.viewQuery = "SELECT (osm || '_' || kind) as id, osm, kind, " + people + " as n, " + weight + " as wt, MAX(lat) as lat, MAX(lon) as lon FROM place_signals GROUP BY osm, kind";
    app.save(v);
  } catch (e) { console.log("error: place_counts weighted:", e); }
  try {
    const v = app.findCollectionByNameOrId("signal_counts");
    v.viewQuery = "SELECT (code || '_' || kind) as id, code, kind, " + people + " as n, " + weight + " as wt FROM signals GROUP BY code, kind";
    app.save(v);
  } catch (e) { console.log("error: signal_counts weighted:", e); }
  try {
    app.db().newQuery("UPDATE place_signals SET lat = 50.86417, lon = 4.36699 WHERE osm = 'n2366986798' AND (lat IS NULL OR lat = 0)").execute();
  } catch (e) { console.log("error: backfill coordinates:", e); }
}, (app) => {});
