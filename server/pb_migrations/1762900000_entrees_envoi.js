/// <reference path="../pb_data/types.d.ts" />
// File des entrées extérieures à envoyer par courriel au fondateur + envoi SMTP direct vers ImprovMX
// (contact@halal.shopping -> Gmail du fondateur), sans clé ni compte. build by Uxlab.ai
migrate((app) => {
  try {
    app.save(new Collection({ type: "base", name: "entrees_envoi", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [{ name: "ref", type: "text", required: true, max: 200 }, { name: "sujet", type: "text", max: 300 }, { name: "texte", type: "text", max: 20000 },
        { name: "historique", type: "bool" }, { name: "envoye", type: "text", max: 40 }, { name: "essais", type: "number" }, { name: "erreur", type: "text", max: 400 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false }],
      indexes: ["CREATE UNIQUE INDEX idx_entrees_ref ON entrees_envoi (ref)"] }));
  } catch (e) { console.log("error: entrees_envoi:", e); }
  try {
    const s = app.settings();
    s.meta.senderName = "halal.shopping"; s.meta.senderAddress = "noreply@halal.shopping";
    s.smtp.enabled = true; s.smtp.host = "mx1.improvmx.com"; s.smtp.port = 25; s.smtp.username = ""; s.smtp.password = ""; s.smtp.tls = false;
    app.save(s);
  } catch (e) { console.log("error: smtp:", e); }
}, (app) => {});
