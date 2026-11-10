/// <reference path="../pb_data/types.d.ts" />
// The fingerprint must not be a hidden field: PocketBase drops values of hidden fields on visitor requests.
// It stays private in practice: only the person's own records are listable, and counts never include it.
migrate((app) => {
  ["signals", "place_signals", "place_ratings", "added_places", "contributions"].forEach((name) => {
    try {
      const c = app.findCollectionByNameOrId(name);
      const f = c.fields.getByName("fp");
      if (f) { f.hidden = false; app.save(c); }
    } catch (e) { console.log("error: fp visible " + name + ":", e); }
  });
}, (app) => {});
