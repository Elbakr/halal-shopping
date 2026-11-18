/// <reference path="../pb_data/types.d.ts" />
// Audience measured without cookies (build by Uxlab.ai).
// audience: one row per day — v visitors, s searches, c contributions, b bot hits (not counted).
// aud_seen: salted daily hashes used only to count each visitor once a day; emptied every night with the salt.
migrate((app) => {
  try {
    app.save(new Collection({ type: "base", name: "audience", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [{ name: "day", type: "text", required: true, max: 10 }, { name: "v", type: "number" }, { name: "s", type: "number" },
        { name: "c", type: "number" }, { name: "b", type: "number" }],
      indexes: ["CREATE UNIQUE INDEX idx_audience_day ON audience (day)"] }));
  } catch (e) { console.log("error: audience:", e); }
  try {
    app.save(new Collection({ type: "base", name: "aud_seen", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [{ name: "day", type: "text", required: true, max: 10 }, { name: "h", type: "text", required: true, max: 64 }, { name: "s", type: "number" }],
      indexes: ["CREATE UNIQUE INDEX idx_aud_seen_dh ON aud_seen (day, h)"] }));
  } catch (e) { console.log("error: aud_seen:", e); }
}, (app) => {});
