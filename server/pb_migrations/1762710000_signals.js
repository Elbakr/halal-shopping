/// <reference path="../pb_data/types.d.ts" />
// One-tap community signals (Waze style). One signal per device, product and kind.
migrate((app) => {
  try {
    const s = new Collection({
      type: "base", name: "signals",
      listRule: null, viewRule: null, updateRule: null, deleteRule: null, createRule: "",
      fields: [
        { name: "code", type: "text", required: true, max: 14, pattern: "^[0-9]{8,14}$" },
        { name: "kind", type: "select", required: true, maxSelect: 1, values: ["seen", "notseen", "changed"] },
        { name: "device", type: "text", required: true, min: 8, max: 40, pattern: "^[a-z0-9]+$" },
        { name: "lang", type: "text", max: 5 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_signals_once ON signals (code, kind, device)",
        "CREATE INDEX idx_signals_code ON signals (code)",
      ],
    });
    app.save(s);
  } catch (e) { console.log("error: signals collection:", e); }
}, (app) => {});
