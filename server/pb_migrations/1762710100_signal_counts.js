/// <reference path="../pb_data/types.d.ts" />
// Public, read-only totals per product: this is all a visitor can read.
migrate((app) => {
  try {
    const v = new Collection({
      type: "view", name: "signal_counts", listRule: "", viewRule: "",
      viewQuery: "SELECT (code || '_' || kind) as id, code, kind, COUNT(*) as n FROM signals GROUP BY code, kind",
    });
    app.save(v);
  } catch (e) { console.log("error: signal_counts view:", e); }
}, (app) => {});
