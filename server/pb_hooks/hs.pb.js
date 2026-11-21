/// <reference path="../pb_data/types.d.ts" />
// halal.shopping: one vote per person and per answer, weighted votes, withdrawal and level. Helpers in hs_utils.js.

onRecordCreateRequest((e) => {
  try { require(`${__hooks}/hs_utils.js`).prepare(e); }
  catch (err) { throw new BadRequestError(String(err && err.message || err).indexOf("Already") >= 0 ? "Already counted." : "hs prepare: " + err); }
  e.next();
}, "signals", "place_signals", "place_ratings", "added_places", "contributions", "place_media", "place_links", "media_flags");

routerAdd("POST", "/api/hs/withdraw", (e) => {
  return e.json(200, require(`${__hooks}/hs_utils.js`).withdraw(e));
});

routerAdd("GET", "/api/hs/me", (e) => {
  return e.json(200, require(`${__hooks}/hs_utils.js`).me(e));
});

// Share pages (previews for WhatsApp and the like, indexable pages for search engines). See hs_share.js.
routerAdd("GET", "/l/{id}", (e) => require(`${__hooks}/hs_share.js`).place(e));
routerAdd("GET", "/p/{code}", (e) => require(`${__hooks}/hs_share.js`).product(e));
routerAdd("GET", "/a/{code}", (e) => require(`${__hooks}/hs_share.js`).additive(e));
routerAdd("GET", "/robots.txt", (e) => require(`${__hooks}/hs_share.js`).robots(e));

// Organisations that certify products and venues. See hs_org.js.
routerAdd("POST", "/api/hs/org/register", (e) => require(`${__hooks}/hs_org.js`).register(e));
routerAdd("GET", "/api/hs/org/me", (e) => require(`${__hooks}/hs_org.js`).me(e));
routerAdd("GET", "/api/hs/org/all", (e) => require(`${__hooks}/hs_org.js`).adminList(e));
routerAdd("POST", "/api/hs/org/review", (e) => require(`${__hooks}/hs_org.js`).review(e));
onRecordUpdateRequest((e) => { require(`${__hooks}/hs_org.js`).guardOrg(e); e.next(); }, "orgs");
onRecordCreateRequest((e) => { require(`${__hooks}/hs_org.js`).itemDefaults(e); e.next(); }, "org_items");

// Product search by name (relevance), see hs_search.js.
routerAdd("GET", "/api/hs/search", (e) => require(`${__hooks}/hs_search.js`).search(e));

// TripAdvisor ratings next to the community's (official Content API, key kept on the server). See hs_ta.js.
routerAdd("GET", "/api/hs/ta", (e) => require(`${__hooks}/hs_ta.js`).lookup(e));
routerAdd("POST", "/api/hs/admin/secret", (e) => require(`${__hooks}/hs_ta.js`).setSecret(e));
routerAdd("GET", "/api/hs/admin/secrets", (e) => require(`${__hooks}/hs_ta.js`).secrets(e));

// Audience without cookies (visitors, searches, contributions per day). See hs_aud.js.
routerAdd("POST", "/api/hs/hit", (e) => require(`${__hooks}/hs_aud.js`).hit(e));
routerAdd("GET", "/api/hs/audience", (e) => require(`${__hooks}/hs_aud.js`).list(e));
cronAdd("hs_aud_nightly", "20 0 * * *", () => require(`${__hooks}/hs_aud.js`).nightly());

// Entrées extérieures -> courriel au fondateur (règle du 21/11/2026). See hs_entrees.js.
onRecordAfterCreateSuccess((e) => {
  try { require(`${__hooks}/hs_entrees.js`).enfiler(e.record, false); } catch (x) { console.log("entrees:", x); }   // mise en file seulement : jamais d'attente pour le visiteur
  e.next();
}, "signals", "place_signals", "place_ratings", "added_places", "contributions", "place_media", "place_links", "media_flags", "orgs", "org_items");
routerAdd("POST", "/api/hs/admin/entrees", (e) => require(`${__hooks}/hs_entrees.js`).admin(e));
routerAdd("GET", "/api/hs/admin/entrees", (e) => require(`${__hooks}/hs_entrees.js`).admin(e));
routerAdd("POST", "/api/hs/depot", (e) => require(`${__hooks}/hs_entrees.js`).depot(e));
cronAdd("hs_entrees", "*/5 * * * *", () => { try { const E = require(`${__hooks}/hs_entrees.js`); if (E.actif()) E.passe(); } catch (x) { console.log("entrees cron:", x); } });
