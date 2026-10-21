/**
 * Testes do guia de tamanhos da camiseta (docs/js/data/tshirt-sizes.js, components/tshirt-sizes.js, features/tshirt-sizes.js, features/release-gate.js): medidas em centímetros, abas por modelo, só em DEV
 * até `public`, atalho e texto escapado.
 *   node --test --test-force-exit DevFestIA/tools/dom/tshirt-sizes.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/release-gate.js", "data/tshirt-sizes.js", "components/tshirt-sizes.js", "features/tshirt-sizes.js"] });
const { document, window } = site;
test.after(() => window.close());
const g = name => site.get(name);
const models = g("tshirtSizesRepository").getAll();
const text = g("tshirtSizesTextsRepository").getAll();

test("os tamanhos de cada modelo, em centímetros (e não em metros)", () => {
  const byId = id => models.find(model => model.id === id).sizes;
  assert.equal(byId("masculina").map(row => row.size).join(), "PP,P,M,G,GG,XG,XXG,XXXG");
  assert.equal(byId("feminina").map(row => row.size).join(), "PP,P,M,G,GG,XG,XXG");
  assert.equal(byId("infantil").map(row => row.size).join(), "6,8,10,12,14");
  const masculinaP = byId("masculina").find(row => row.size === "P");
  assert.deepEqual([masculinaP.height, masculinaP.width], [69, 54]); // o formulário do Sympla mostra "Masculina P (Largura: 54cm - Altura: 69cm)"
  assert.ok(models.flatMap(model => model.sizes).every(row => row.height >= 40 && row.height <= 90 && row.width >= 30 && row.width <= 70), "valores de centímetros");
});

test("não aparece enquanto não for público; em DEV ou `public: true` aparece com abas, desenho e tabela", () => {
  const hidden = document.createElement("section");
  assert.equal(g("initTshirtSizes")(hidden, { models, text, config: { public: false }, devMode: false }), false);
  assert.equal(hidden.hidden, true);
  assert.equal(hidden.innerHTML, "");
  const shown = document.createElement("section");
  assert.equal(g("initTshirtSizes")(shown, { models, text, config: { public: false }, devMode: true }), true);
  assert.equal(shown.hidden, false);
  assert.equal(shown.querySelectorAll("[data-sizes-model]").length, 3);
  assert.ok(shown.querySelector("svg.ts-diagram"));
  assert.equal(shown.querySelectorAll("tbody tr").length, 8);
  assert.match(textOf(shown), /Medidas aproximadas: podem variar até 2 cm/);
  assert.match(textOf(shown.querySelector("tbody tr")), /PP\s*67 cm\s*51 cm/);
  const released = document.createElement("section");
  assert.equal(g("initTshirtSizes")(released, { models, text, config: { public: true }, devMode: false }), true);
});

test("clicar numa aba troca a tabela", () => {
  const section = document.createElement("section");
  g("initTshirtSizes")(section, { models, text, config: { public: true } });
  section.querySelector('[data-sizes-model="infantil"]').click();
  assert.equal(section.querySelectorAll("tbody tr").length, 5);
  assert.match(textOf(section.querySelector("tbody tr")), /6\s*47 cm\s*35 cm/);
  assert.equal(section.querySelector('[data-sizes-model="infantil"]').getAttribute("aria-pressed"), "true");
});

test("o atalho leva ao guia e o texto do dado é escapado", () => {
  const link = document.createElement("div");
  link.innerHTML = g("tshirtSizesLinkMarkup")(text);
  assert.equal(link.querySelector("a").getAttribute("href"), "#tamanhos");
  const html = g("tshirtSizesMarkup")({ models: [{ id: "x", label: "<b>x</b>", sizes: [{ size: "<i>y</i>", height: 1, width: 2 }] }], text, activeId: "x" });
  assert.doesNotMatch(html, /<b>x|<i>y/);
});

test("a regra de liberação é a mesma de todo o site", () => {
  const isReleased = g("isReleased");
  assert.equal(isReleased({ public: false }, { devMode: false }), false);
  assert.equal(isReleased({ public: false }, { devMode: true }), true);
  assert.equal(isReleased({ public: true }), true);
});
