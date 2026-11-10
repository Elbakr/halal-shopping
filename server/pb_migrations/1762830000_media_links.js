/// <reference path="../pb_data/types.d.ts" />
// Proof brought by members: photos of a venue (front, menu, halal certificate, opening hours, alcohol on sale...)
// and exact links to the venue's own pages (delivery platforms, website, social).
// No device id is stored: "who" is a one-way hash, set by the server, so a member can withdraw their own items.
// The uploader's position is never stored either, only its distance to the venue ("taken on site").
migrate((app) => {
  try {
    const c = new Collection({
      type: "base", name: "place_media",
      listRule: "", viewRule: "", createRule: "", updateRule: null, deleteRule: null,
      fields: [
        { name: "osm", type: "text", required: true, max: 24, pattern: "^([nwr][0-9]{1,20}|u[a-z0-9]{15})$" },
        { name: "kind", type: "select", required: true, maxSelect: 1, values: ["front", "menu", "certificate", "hours", "alcohol", "other"] },
        { name: "photo", type: "file", required: true, maxSelect: 1, maxSize: 8388608, mimeTypes: ["image/jpeg", "image/png", "image/webp"], thumbs: ["400x0", "160x160"] },
        { name: "dist", type: "number", min: -1, max: 100000000 },
        { name: "who", type: "text", max: 64 },
        { name: "w", type: "number", min: 0, max: 100 },
        { name: "lang", type: "text", max: 5 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
      indexes: ["CREATE INDEX idx_place_media_osm ON place_media (osm)"],
    });
    app.save(c);
  } catch (e) { console.log("error: place_media:", e); }
  try {
    const c = new Collection({
      type: "base", name: "place_links",
      listRule: "", viewRule: "", createRule: "", updateRule: null, deleteRule: null,
      fields: [
        { name: "osm", type: "text", required: true, max: 24, pattern: "^([nwr][0-9]{1,20}|u[a-z0-9]{15})$" },
        { name: "platform", type: "select", required: true, maxSelect: 1, values: ["ubereats", "deliveroo", "takeaway", "website", "instagram", "facebook", "tiktok"] },
        { name: "url", type: "url", required: true },
        { name: "who", type: "text", max: 64 },
        { name: "w", type: "number", min: 0, max: 100 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
      indexes: ["CREATE INDEX idx_place_links_osm ON place_links (osm)"],
    });
    app.save(c);
  } catch (e) { console.log("error: place_links:", e); }
  try {
    const c = new Collection({
      type: "base", name: "media_flags",
      listRule: null, viewRule: null, createRule: "", updateRule: null, deleteRule: null,
      fields: [
        { name: "media", type: "text", required: true, min: 15, max: 15, pattern: "^[a-z0-9]{15}$" },
        { name: "who", type: "text", max: 64 },
        { name: "w", type: "number", min: 0, max: 100 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
    });
    app.save(c);
  } catch (e) { console.log("error: media_flags:", e); }
  try {
    const v = new Collection({
      type: "view", name: "media_flag_sum", listRule: "", viewRule: "",
      viewQuery: "SELECT media as id, media, COUNT(*) as n, SUM(CASE WHEN w > 0 THEN w ELSE 1 END) as wt FROM media_flags GROUP BY media",
    });
    app.save(v);
  } catch (e) { console.log("error: media_flag_sum:", e); }
}, (app) => {});
