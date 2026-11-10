/// <reference path="../pb_data/types.d.ts" />
// Certification bodies, public authorities, mosques and federations that join halal.shopping.
// An organisation registers (status "pending"), halal.shopping checks it through its official channels, then it
// declares the products and venues it certifies, each with its certificate number, validity and document.
// The organisation acts with a private key sent in the "X-Org-Key" header; the key is never readable through the API.
migrate((app) => {
  let orgs;
  try {
    orgs = new Collection({
      type: "base", name: "orgs",
      listRule: 'status = "verified"', viewRule: 'status = "verified"', createRule: null,
      updateRule: '@request.headers.x_org_key != "" && key = @request.headers.x_org_key', deleteRule: null,
      fields: [
        { name: "name", type: "text", required: true, min: 2, max: 120 },
        { name: "kind", type: "select", required: true, maxSelect: 1, values: ["certifier", "authority", "mosque", "federation", "association", "other"] },
        { name: "country", type: "text", max: 2, pattern: "^[A-Z]{0,2}$" },
        { name: "website", type: "url" },
        { name: "email", type: "email", required: true, hidden: true },
        { name: "phone", type: "text", max: 30, hidden: true },
        { name: "contact", type: "text", max: 80, hidden: true },
        { name: "regno", type: "text", max: 80 },
        { name: "about", type: "text", max: 600 },
        { name: "logo", type: "file", maxSelect: 1, maxSize: 2097152, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"], thumbs: ["160x160"] },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["pending", "verified", "rejected", "suspended"] },
        { name: "key", type: "text", hidden: true, max: 64 },
        { name: "lang", type: "text", max: 5 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_orgs_key ON orgs (key)", "CREATE INDEX idx_orgs_status ON orgs (status)"],
    });
    app.save(orgs);
  } catch (e) { console.log("error: orgs:", e); orgs = app.findCollectionByNameOrId("orgs"); }
  try {
    const ok = '@request.headers.x_org_key != "" && org.key = @request.headers.x_org_key && org.status = "verified"';
    const c = new Collection({
      type: "base", name: "org_items",
      listRule: 'org.status = "verified" && active = true', viewRule: 'org.status = "verified" && active = true',
      createRule: ok, updateRule: ok + " && @request.body.org:isset = false", deleteRule: ok,
      fields: [
        { name: "org", type: "relation", required: true, collectionId: orgs.id, maxSelect: 1, cascadeDelete: true },
        { name: "target", type: "select", required: true, maxSelect: 1, values: ["product", "place"] },
        { name: "code", type: "text", required: true, max: 24, pattern: "^([0-9]{8,14}|[nwr][0-9]{1,20}|u[a-z0-9]{15})$" },
        { name: "label", type: "text", max: 120 },
        { name: "certno", type: "text", max: 60 },
        { name: "until", type: "date" },
        { name: "scope", type: "text", max: 200 },
        { name: "doc", type: "file", maxSelect: 1, maxSize: 8388608, mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
        { name: "active", type: "bool" },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_org_items_one ON org_items (org, target, code)", "CREATE INDEX idx_org_items_code ON org_items (code)"],
    });
    app.save(c);
  } catch (e) { console.log("error: org_items:", e); }
}, (app) => {});
