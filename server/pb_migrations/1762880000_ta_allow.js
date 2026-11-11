/// <reference path="../pb_data/types.d.ts" />
// TripAdvisor (Terra): remember which listing IDs are on our allowlist. Only the ID may be kept (their caching policy);
// ratings are read live and never stored, so the old rating columns are emptied.
migrate((app) => {
  const c = app.findCollectionByNameOrId("ta_cache");
  if (!c.fields.getByName("al")) { c.fields.add(new BoolField({ name: "al" })); app.save(c); }
  app.db().newQuery("UPDATE ta_cache SET rating = 0, n = 0, url = '', img = ''").execute();
}, (app) => {});
