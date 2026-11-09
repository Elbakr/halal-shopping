/// <reference path="../pb_data/types.d.ts" />
// More photo kinds, and a create limit that lets an active contributor work.
migrate((app) => {
  try {
    const c = app.findCollectionByNameOrId("contributions");
    c.fields.getByName("kind").values = ["logo", "ingredients", "report", "front"];
    app.save(c);
  } catch (e) { console.log("error: contributions kinds:", e); }
  try {
    const s = app.settings();
    s.rateLimits.rules = [
      { label: "*:create", maxRequests: 30, duration: 60, audience: "" },
      { label: "/api/", maxRequests: 240, duration: 60, audience: "" },
    ];
    app.save(s);
  } catch (e) { console.log("error: limits:", e); }
}, (app) => {});
