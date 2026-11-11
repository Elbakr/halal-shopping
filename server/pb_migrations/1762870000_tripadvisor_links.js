/// <reference path="../pb_data/types.d.ts" />
// Venues: the TripAdvisor listing joins the links members can bring (its rating is then shown next to ours).
migrate((app) => {
  const c = app.findCollectionByNameOrId("place_links");
  const f = c.fields.getByName("platform");
  if (f.values.indexOf("tripadvisor") < 0) { f.values = f.values.concat(["tripadvisor"]); app.save(c); }
}, (app) => {});
