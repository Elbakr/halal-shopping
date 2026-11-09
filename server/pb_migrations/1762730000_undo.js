/// <reference path="../pb_data/types.d.ts" />
// A device can find and withdraw its own signals (undo). Device ids are never listed publicly.
migrate((app) => {
  ["signals", "place_signals"].forEach((n) => {
    try {
      const c = app.findCollectionByNameOrId(n);
      c.listRule = "device = @request.query.device";
      c.viewRule = "device = @request.query.device";
      c.deleteRule = "device = @request.query.device";
      app.save(c);
    } catch (e) { console.log("error: undo rule " + n + ":", e); }
  });
}, (app) => {});
