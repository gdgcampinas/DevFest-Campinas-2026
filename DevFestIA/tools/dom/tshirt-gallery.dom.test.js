/**
 * Testes da vitrine e da galeria da camiseta do kit (docs/js/features/tshirt-gallery.js, components/tshirt-gallery.js, data/tshirts.js): a vitrine no card, o modal, a troca de modelo e de lado.
 *   node --test --test-force-exit DevFestIA/tools/dom/tshirt-gallery.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "components/modal.js", "data/tshirts.js", "components/tshirt-gallery.js", "features/tshirt-gallery.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const models = g("tshirtsRepository").getAll();
const text = g("tshirtTextsRepository").getAll();

test("os 3 modelos têm frente e costas, com miniatura, e todos os arquivos existem", () => {
  assert.equal(models.map(model => model.id).join(), "masculina,feminina,infantil");
  for (const model of models) for (const kind of ["images", "thumbs"]) for (const side of ["frente", "costas"]) {
    assert.ok(fs.existsSync(path.join(DOCS, model[kind][side])), model[kind][side]);
  }
});

test("a regra troca modelo e lado sem perder o outro", () => {
  const next = g("nextTshirtView");
  assert.equal(JSON.stringify(next({ modelId: "masculina", side: "frente" }, { side: "costas" })), '{"modelId":"masculina","side":"costas"}');
  assert.equal(JSON.stringify(next({ modelId: "masculina", side: "costas" }, { modelId: "infantil" })), '{"modelId":"infantil","side":"costas"}');
});

test("a vitrine mostra as 3 camisetas e o convite; clicar abre a galeria, que troca de modelo e de lado", () => {
  document.body.innerHTML = `<div id="card">${g("tshirtShowcaseMarkup")({ models, text })}</div>`;
  g("initTshirtGallery")(document.body, { createModal: g("createModal"), models, text });
  const showcase = document.querySelector("[data-tshirt-open]");
  assert.equal(showcase.querySelectorAll("img").length, 3);
  assert.match(textOf(showcase), /Ver a camiseta/);
  showcase.click();
  const modal = document.getElementById("tshirtModal");
  assert.equal(modal.hidden, false);
  assert.match(modal.querySelector(".tshirt-stage img").getAttribute("src"), /masculina-frente\.webp$/);
  modal.querySelector('[data-tshirt-model="feminina"]').click();
  assert.match(modal.querySelector(".tshirt-stage img").getAttribute("src"), /feminina-frente\.webp$/);
  modal.querySelector('[data-tshirt-side="costas"]').click();
  assert.match(modal.querySelector(".tshirt-stage img").getAttribute("src"), /feminina-costas\.webp$/);
  assert.equal(modal.querySelector('[data-tshirt-side="costas"]').getAttribute("aria-pressed"), "true");
  assert.match(textOf(modal), /Fotos ilustrativas/);
  assert.match(modal.querySelector(".tshirt-stage img").getAttribute("alt"), /Camiseta: Feminina, Costas/);
});
