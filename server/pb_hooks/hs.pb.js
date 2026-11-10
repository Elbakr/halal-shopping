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
