/// <reference path="../pb_data/types.d.ts" />
// Alcohol reports (and their rebuttal), coordinates on signals so that a whole neighbourhood is read in one request,
// and member ratings with a public average.
migrate((app) => {
  try {
    const s = app.findCollectionByNameOrId("place_signals");
    s.fields.getByName("kind").values = ["confirm", "nothalal", "closed", "alcohol", "noalcohol"];
    if (!s.fields.getByName("lat")) s.fields.add(new NumberField({ name: "lat", min: -90, max: 90 }));
    if (!s.fields.getByName("lon")) s.fields.add(new NumberField({ name: "lon", min: -180, max: 180 }));
    app.save(s);
  } catch (e) { console.log("error: place_signals alcohol:", e); }
  try {
    const v = app.findCollectionByNameOrId("place_counts");
    v.viewQuery = "SELECT (osm || '_' || kind) as id, osm, kind, COUNT(*) as n, MAX(lat) as lat, MAX(lon) as lon FROM place_signals GROUP BY osm, kind";
    app.save(v);
  } catch (e) { console.log("error: place_counts view:", e); }
  try {
    const c = new Collection({
      type: "base", name: "place_ratings",
      listRule: "device = @request.query.device", viewRule: "device = @request.query.device",
      updateRule: null, deleteRule: "device = @request.query.device", createRule: "",
      fields: [
        { name: "osm", type: "text", required: true, max: 24, pattern: "^([nwr][0-9]{1,20}|u[a-z0-9]{15})$" },
        { name: "stars", type: "number", required: true, min: 1, max: 5, onlyInt: true },
        { name: "device", type: "text", required: true, min: 8, max: 40, pattern: "^[a-z0-9]+$" },
        { name: "lat", type: "number", min: -90, max: 90 },
        { name: "lon", type: "number", min: -180, max: 180 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_place_ratings_once ON place_ratings (osm, device)"],
    });
    app.save(c);
  } catch (e) { console.log("error: place_ratings:", e); }
  try {
    const v = new Collection({
      type: "view", name: "place_rating_avg", listRule: "", viewRule: "",
      viewQuery: "SELECT osm as id, osm, ROUND(AVG(stars), 2) as avg, COUNT(*) as n, MAX(lat) as lat, MAX(lon) as lon FROM place_ratings GROUP BY osm",
    });
    app.save(v);
  } catch (e) { console.log("error: place_rating_avg view:", e); }
}, (app) => {});
