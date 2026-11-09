/// <reference path="../pb_data/types.d.ts" />
// Photos and reports sent by visitors. Anyone may send one; only the admin can read them.
migrate((app) => {
  const c = new Collection({
    type: "base",
    name: "contributions",
    listRule: null, viewRule: null, updateRule: null, deleteRule: null,
    createRule: "",
    fields: [
      { name: "code", type: "text", required: true, max: 14, pattern: "^[0-9]{8,14}$" },
      { name: "kind", type: "select", required: true, maxSelect: 1, values: ["logo", "ingredients", "report"] },
      { name: "note", type: "text", max: 500 },
      { name: "lang", type: "text", max: 5 },
      { name: "photo", type: "file", maxSelect: 1, maxSize: 6000000, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
  });
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("contributions");
  if (c) app.delete(c);
});
