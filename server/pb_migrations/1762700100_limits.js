/// <reference path="../pb_data/types.d.ts" />
// Rate limits and real visitor IP behind Caddy. Never blocks startup if a setting name changes.
migrate((app) => {
  try {
    const s = app.settings();
    s.trustedProxy.headers = ["X-Forwarded-For"];
    s.trustedProxy.useLeftmostIP = true;
    s.rateLimits.enabled = true;
    s.rateLimits.rules = [
      { label: "*:create", maxRequests: 6, duration: 60, audience: "" },
      { label: "/api/", maxRequests: 120, duration: 60, audience: "" },
    ];
    app.save(s);
  } catch (e) { console.log("limits migration skipped:", e); }
}, (app) => {});
