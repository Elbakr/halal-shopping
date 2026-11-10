/// <reference path="../pb_data/types.d.ts" />
// halal.shopping: one vote per person and per answer, weighted votes, withdrawal and level. Helpers in hs_utils.js.

onRecordCreateRequest((e) => {
  try { require(`${__hooks}/hs_utils.js`).prepare(e); }
  catch (err) { throw new BadRequestError("hs prepare: " + err); }
  e.next();
}, "signals", "place_signals", "place_ratings", "added_places", "contributions");

routerAdd("POST", "/api/hs/withdraw", (e) => {
  return e.json(200, require(`${__hooks}/hs_utils.js`).withdraw(e));
});

routerAdd("GET", "/api/hs/me", (e) => {
  return e.json(200, require(`${__hooks}/hs_utils.js`).me(e));
});
