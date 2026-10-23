/**
 * Testes do mapa do campus (docs/js/data/venue-map.js, components/venue-campus-map.js, features/venue-campus-map.js, features/release-gate.js): só em DEV até `public`, pontos clicáveis, aproximar e texto escapado.
 *   node --test --test-force-exit DevFestIA/tools/dom/venue-campus-map.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/release-gate.js", "data/venue-map.js", "components/venue-campus-map.js", "features/venue-campus-map.js"] });
const { document, window } = site;
test.after(() => window.close());
const g = name => site.get(name);
const deps = () => ({ map: g("venueMapRepository").getAll(), points: g("venueMapPointsRepository").getAll(), types: g("venueMapTypesRepository").getAll(), text: g("venueMapTextsRepository").getAll() });
const mount = (config, devMode) => {
  const el = document.createElement("section");
  const shown = g("initVenueCampusMap")(el, { ...deps(), config, devMode });
  return { el, shown };
};

test("os pontos pedidos existem, dentro da imagem e com cor por tipo", () => {
  const { points, types } = deps();
  assert.equal(points.map(point => point.id).join(), ["h2", "bus", "info", "foodtruck", "food", "parking", "gate1", "gate2", "gate3"].join());
  assert.ok(points.every(point => point.x > 0 && point.x < 100 && point.y > 0 && point.y < 100 && types[point.kind]?.color));
  assert.equal(new Set(points.map(point => point.id)).size, points.length);
});

test("não aparece enquanto não for público; em DEV ou `public: true` aparece com um pino por ponto", () => {
  const hidden = mount({ public: false }, false);
  assert.equal(hidden.shown, false);
  assert.equal(hidden.el.hidden, true);
  assert.equal(hidden.el.innerHTML, "");
  const dev = mount({ public: false }, true);
  assert.equal(dev.shown, true);
  assert.equal(dev.el.querySelectorAll(".vm-pin").length, 9);
  assert.equal(dev.el.querySelectorAll(".vm-chip").length, 9);
  assert.equal(mount({ public: true }, false).shown, true);
});

test("clicar num pino ou na lista abre o ponto, e o botão aproxima e afasta", () => {
  const { el } = mount({ public: false }, true);
  assert.match(textOf(el.querySelector(".vm-detail")), /Prédio H-02/);
  el.querySelector('.vm-pin[data-map-point="gate3"]').click();
  assert.match(textOf(el.querySelector(".vm-detail")), /Portão 3/);
  el.querySelector('.vm-chip[data-map-point="parking"]').click();
  assert.match(textOf(el.querySelector(".vm-detail")), /Estacionamento C/);
  assert.equal(el.querySelectorAll('[aria-pressed="true"][data-map-point]').length, 2); // o pino e o botão do ponto aberto
  assert.match(el.querySelector(".vm-stage").getAttribute("style"), /scale\(1\)/);
  el.querySelector("[data-map-zoom]").click();
  assert.match(el.querySelector(".vm-stage").getAttribute("style"), /scale\(2\.3\)/);
  assert.match(textOf(el.querySelector("[data-map-zoom]")), /campus inteiro/);
  el.querySelector("[data-map-zoom]").click();
  assert.match(el.querySelector(".vm-stage").getAttribute("style"), /scale\(1\)/);
});

test("tem o link do mapa oficial e escapa texto de ponto", () => {
  const { map, types, text } = deps();
  const html = g("venueCampusMapMarkup")({ map, types, text, selectedId: "x", zoomed: false, points: [{ id: "x", kind: "gate", mark: "<b>", x: 10, y: 10, name: "<img src=x onerror=1>", text: "a & b" }] });
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img src=x onerror=1&gt;"));
  assert.match(html, /href="https:\/\/www\.puc-campinas\.edu\.br\/wp-content\/uploads\/2026\/07\/Mapa-PUC-Campus-I-26-2\.pdf"/);
});
