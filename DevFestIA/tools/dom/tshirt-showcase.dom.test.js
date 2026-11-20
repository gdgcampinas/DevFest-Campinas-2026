/**
 * Vitrine da camiseta no card de ingresso: com as 3 fotos (padrão) ou só o botão "Ver a camiseta" (`withImages: false`, usado quando as vendas encerram).
 *   node --test --test-force-exit DevFestIA/tools/dom/tshirt-showcase.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/tshirts.js", "components/tshirt-gallery.js"] });
const { window, document } = site;
test.after(() => window.close());
const deps = () => ({ models: site.get("tshirtsRepository").getAll(), text: site.get("tshirtTextsRepository").getAll() });
const render = options => { const box = document.createElement("div"); box.innerHTML = site.get("tshirtShowcaseMarkup")({ ...deps(), ...options }); return box; };

test("vitrine padrão: uma foto por modelo e o botão", () => {
  const box = render();
  assert.equal(box.querySelectorAll(".tshirt-showcase-imgs img").length, 3);
  assert.equal(textOf(box.querySelector(".tshirt-showcase-cta")), "Ver a camiseta");
});

test("sem fotos (vendas encerradas): só o botão, ainda abre a galeria", () => {
  const box = render({ withImages: false });
  assert.equal(box.querySelector(".tshirt-showcase-imgs"), null);
  assert.equal(textOf(box.querySelector(".tshirt-showcase-cta")), "Ver a camiseta");
  assert.ok(box.querySelector("[data-tshirt-open]"));
});
