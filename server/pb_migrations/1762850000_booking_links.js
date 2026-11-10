/// <reference path="../pb_data/types.d.ts" />
// Venues: the restaurant's own online booking page joins the links members can bring.
migrate((app) => {
  const c = app.findCollectionByNameOrId("place_links");
  const f = c.fields.getByName("platform");
  if (f.values.indexOf("booking") < 0) { f.values = f.values.concat(["booking"]); app.save(c); }
}, (app) => {});
