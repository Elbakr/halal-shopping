/// <reference path="../pb_data/types.d.ts" />
// One-tap signals on shops and restaurants (OpenStreetMap ids), plus public totals.
migrate((app) => {
  try {
    const s = new Collection({
      type: "base", name: "place_signals",
      listRule: null, viewRule: null, updateRule: null, deleteRule: null, createRule: "",
      fields: [
        { name: "osm", type: "text", required: true, max: 24, pattern: "^[nwr][0-9]{1,20}$" },
        { name: "kind", type: "select", required: true, maxSelect: 1, values: ["confirm", "nothalal", "closed"] },
        { name: "device", type: "text", required: true, min: 8, max: 40, pattern: "^[a-z0-9]+$" },
        { name: "lang", type: "text", max: 5 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_place_signals_once ON place_signals (osm, kind, device)",
        "CREATE INDEX idx_place_signals_osm ON place_signals (osm)",
      ],
    });
    app.save(s);
  } catch (e) { console.log("error: place_signals collection:", e); }
  try {
    const v = new Collection({
      type: "view", name: "place_counts", listRule: "", viewRule: "",
      viewQuery: "SELECT (osm || '_' || kind) as id, osm, kind, COUNT(*) as n FROM place_signals GROUP BY osm, kind",
    });
    app.save(v);
  } catch (e) { console.log("error: place_counts view:", e); }
}, (app) => {});
