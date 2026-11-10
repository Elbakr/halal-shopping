/// <reference path="../pb_data/types.d.ts" />
// Ratings published elsewhere (TripAdvisor, official Content API) shown next to the community's own rating.
// hs_secrets: keys given by the administrator through the site; never readable through the API.
// ta_cache: which TripAdvisor listing matches a venue, and its rating (refreshed every day).
// ta_usage: calls made per month, to stay inside the free allowance.
migrate((app) => {
  try {
    app.save(new Collection({ type: "base", name: "hs_secrets", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [{ name: "name", type: "text", required: true, max: 40 }, { name: "value", type: "text", hidden: true, max: 500 },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true }],
      indexes: ["CREATE UNIQUE INDEX idx_hs_secrets_name ON hs_secrets (name)"] }));
  } catch (e) { console.log("error: hs_secrets:", e); }
  try {
    app.save(new Collection({ type: "base", name: "ta_cache", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [{ name: "osm", type: "text", required: true, max: 24 }, { name: "ta", type: "text", max: 20 }, { name: "rating", type: "number" },
        { name: "n", type: "number" }, { name: "url", type: "text", max: 400 }, { name: "img", type: "text", max: 400 }, { name: "name", type: "text", max: 120 },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true }],
      indexes: ["CREATE UNIQUE INDEX idx_ta_cache_osm ON ta_cache (osm)"] }));
  } catch (e) { console.log("error: ta_cache:", e); }
  try {
    app.save(new Collection({ type: "base", name: "ta_usage", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [{ name: "month", type: "text", required: true, max: 7 }, { name: "n", type: "number" }],
      indexes: ["CREATE UNIQUE INDEX idx_ta_usage_month ON ta_usage (month)"] }));
  } catch (e) { console.log("error: ta_usage:", e); }
}, (app) => {});
