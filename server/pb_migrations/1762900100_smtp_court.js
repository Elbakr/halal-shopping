/// <reference path="../pb_data/types.d.ts" />
// Le port 25 sortant ne répond pas depuis halal-api-1 (21/11) : envoi SMTP coupé tant qu'un transport n'est pas prouvé.
migrate((app) => { try { const s = app.settings(); s.smtp.enabled = false; app.save(s); } catch (e) { console.log("error: smtp off:", e); } }, (app) => {});
