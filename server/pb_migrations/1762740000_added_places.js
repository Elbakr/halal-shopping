/// <reference path="../pb_data/types.d.ts" />
// Places added by members in one gesture, a public view without the device id,
// signals accepted on member-added places, and a community counter.
migrate((app) => {
  try {
    const c = new Collection({
      type: "base", name: "added_places",
      listRule: "device = @request.query.device", viewRule: "device = @request.query.device",
      updateRule: null, deleteRule: "device = @request.query.device", createRule: "",
      fields: [
        { name: "name", type: "text", required: true, min: 2, max: 80 },
        { name: "kind", type: "select", required: true, maxSelect: 1, values: ["r", "f", "b", "s"] },
        { name: "lat", type: "number", required: true, min: -90, max: 90 },
        { name: "lon", type: "number", required: true, min: -180, max: 180 },
        { name: "device", type: "text", required: true, min: 8, max: 40, pattern: "^[a-z0-9]+$" },
        { name: "lang", type: "text", max: 5 },
        { name: "photo", type: "file", maxSelect: 1, maxSize: 6291456, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
      indexes: ["CREATE INDEX idx_added_places_geo ON added_places (lat, lon)"],
    });
    app.save(c);
  } catch (e) { console.log("error: added_places:", e); }
  try {
    const v = new Collection({
      type: "view", name: "added_public", listRule: "", viewRule: "",
      viewQuery: "SELECT id, name, kind, lat, lon, created FROM added_places",
    });
    app.save(v);
  } catch (e) { console.log("error: added_public view:", e); }
  try {
    const s = app.findCollectionByNameOrId("place_signals");
    s.fields.getByName("osm").pattern = "^([nwr][0-9]{1,20}|u[a-z0-9]{15})$";
    app.save(s);
  } catch (e) { console.log("error: place_signals pattern:", e); }
  try {
    const v = new Collection({
      type: "view", name: "community_stats", listRule: "", viewRule: "",
      viewQuery: "SELECT 'all' as id, ((SELECT COUNT(*) FROM signals) + (SELECT COUNT(*) FROM place_signals) + (SELECT COUNT(*) FROM added_places) + (SELECT COUNT(*) FROM contributions)) as n",
    });
    app.save(v);
  } catch (e) { console.log("error: community_stats view:", e); }
}, (app) => {});
