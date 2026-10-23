/**
 * Testes do mapa do campus (docs/js/data/venue-map.js, components/venue-campus-map.js, features/venue-campus-map.js, features/release-gate.js): só em DEV até `public`, pontos clicáveis, aproximar e texto escapado.
 *   node --test --test-force-exit DevFestIA/tools/dom/venue-campus-map.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/release-gate.js", "data/venue-map.js", "components/venue-campus-map.js", "features/venue-campus-map.js", "components/site-nav.js"] });
const { document, window } = site;
test.after(() => window.close());
const g = name => site.get(name);
const deps = () => ({ map: g("venueMapRepository").getAll(), points: g("venueMapPointsRepository").getAll(), groups: g("venueMapGroupsRepository").getAll(), types: g("venueMapTypesRepository").getAll(), text: g("venueMapTextsRepository").getAll() });
const mount = (config, devMode, extra = {}) => {
  const el = document.createElement("section");
  const shown = g("initVenueCampusMap")(el, { ...deps(), config, devMode, ...extra });
  return { el, shown };
};

test("os pontos pedidos existem, dentro da imagem e com cor por tipo", () => {
  const { points, types } = deps();
  assert.equal([...points.map(point => point.id)].sort().join(), ["bus", "food", "foodtruck", "gate1", "gate2", "gate3", "h2", "info", "parking"].join());
  assert.ok(points.every(point => g("venueMapGroupsRepository").getAll().includes(point.group)), "todo ponto está num grupo da lista");
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
  assert.equal(dev.el.querySelectorAll(".vm-card").length, 9);
  assert.equal([...dev.el.querySelectorAll(".vm-group-title")].map(el => textOf(el)).join(), "Chegada,No local,Comer");
  assert.equal(mount({ public: true }, false).shown, true);
});

test("clicar num pino ou na lista abre o ponto, e o botão aproxima e afasta", () => {
  const { el } = mount({ public: false }, true, { reveal: () => {} });
  assert.match(textOf(el.querySelector(".vm-detail")), /Prédio H-02/);
  el.querySelector('.vm-pin[data-map-point="gate3"]').click();
  assert.match(textOf(el.querySelector(".vm-detail")), /Portão 3/);
  el.querySelector('.vm-card[data-map-point="parking"]').click();
  assert.match(textOf(el.querySelector(".vm-tip")), /Estacionamento C/); // o rótulo anda junto com o ponto aberto
  assert.equal(el.querySelectorAll(".vm-tip").length, 1);
  assert.match(textOf(el.querySelector(".vm-detail")), /Estacionamento C/);
  assert.equal(el.querySelectorAll('[aria-pressed="true"][data-map-point]').length, 2); // o pino e o botão do ponto aberto
  assert.match(el.querySelector(".vm-stage").getAttribute("style"), /scale\(2\.3\)/, "escolher na lista aproxima no ponto");
  assert.match(textOf(el.querySelector("[data-map-zoom]")), /campus inteiro/);
  el.querySelector("[data-map-zoom]").click();
  assert.match(el.querySelector(".vm-stage").getAttribute("style"), /scale\(1\)/);
  assert.match(textOf(el.querySelector("[data-map-zoom]")), /Aproximar/);
  el.querySelector("[data-map-zoom]").click();
  assert.match(el.querySelector(".vm-stage").getAttribute("style"), /scale\(2\.3\)/);
});

test("escolher na lista aproxima o mapa no ponto e leva a tela até o mapa; o pino só troca o ponto", () => {
  const revealed = [];
  const { el } = mount({ public: false }, true, { reveal: viewport => revealed.push(viewport) });
  const stage = () => el.querySelector(".vm-stage").getAttribute("style");
  el.querySelector('.vm-pin[data-map-point="gate3"]').click();
  assert.equal(revealed.length, 0, "o pino já está no mapa: não rola");
  assert.match(stage(), /scale\(1\)/, "o pino não aproxima");
  el.querySelector('.vm-card[data-map-point="gate3"]').click();
  assert.equal(revealed.length, 1);
  assert.ok(revealed[0].classList.contains("vm-viewport"));
  assert.match(stage(), /scale\(2\.3\)/);
  const gate3 = deps().points.find(point => point.id === "gate3");
  assert.ok(stage().includes(`translate(${g("venueMapShift")(gate3.x, 2.3)}%,${g("venueMapShift")(gate3.y, 2.3)}%)`), "centraliza no ponto escolhido");
  assert.match(textOf(el.querySelector("[data-map-zoom]")), /campus inteiro/);
  el.querySelector("[data-map-zoom]").click();
  assert.match(stage(), /scale\(1\)/, "o botão volta ao campus inteiro");
  el.querySelector("[data-map-zoom]").click();
  assert.ok(stage().includes(`translate(${g("venueMapShift")(47, 2.3)}%`), "e aproxima de novo no H-02");
});

test("o deslocamento nunca mostra além da borda do mapa", () => {
  const shift = g("venueMapShift");
  assert.equal(shift(0, 2.3), 0);
  assert.ok(Math.abs(shift(100, 2.3) - (100 - 230)) < 1e-9);
  assert.ok(Math.abs(shift(50, 2.3) - (50 - 115)) < 1e-9);
});

test("a página mostra o aviso em breve enquanto o mapa não é público, e a principal não mostra nada", () => {
  const soon = mount({ public: false }, false, { soon: true });
  assert.equal(soon.shown, false);
  assert.equal(soon.el.hidden, false);
  assert.match(textOf(soon.el), /O mapa do local chega em breve/);
  const callout = document.createElement("section");
  const calloutInit = g("initVenueMapCallout");
  assert.equal(calloutInit(callout, { text: deps().text, config: { public: false }, devMode: false }), false);
  assert.equal(callout.hidden, true);
  assert.equal(callout.innerHTML, "");
  assert.equal(calloutInit(callout, { text: deps().text, config: { public: false }, devMode: true }), true);
  assert.equal(callout.querySelector("a.vm-callout").getAttribute("href"), "local.html");
  assert.match(textOf(callout), /Como chegar ao local/);
});

test("o menu leva à página \"Como chegar\" e só sai do modo DEV junto com o mapa", () => {
  const entry = g("SITE_PAGES").find(page => page.id === "local");
  assert.equal(entry.href, "local.html");
  if (g("venueMapConfigRepository").getAll().public) assert.ok(!entry.devOnly, "mapa público: o menu não pode ficar escondido");
});

test("só o portão 2 é a entrada: ganha a etiqueta e a cor própria, e os outros portões ficam discretos", () => {
  const { el } = mount({ public: false }, true);
  const pin = id => el.querySelector(`.vm-pin[data-map-point="${id}"]`);
  assert.ok(pin("gate2").classList.contains("vm-pin--entrance"));
  assert.match(textOf(pin("gate2")), /Entrada/);
  assert.ok(pin("gate1").classList.contains("vm-pin--minor") && pin("gate3").classList.contains("vm-pin--minor"));
  assert.equal(el.querySelectorAll(".vm-pin-tag").length, 1);
  assert.ok(g("venueMapTypesRepository").getAll().entrance.color !== g("venueMapTypesRepository").getAll().gate.color);
});

test("o cartão da principal mostra a linha de acesso do local quando existe", () => {
  const callout = document.createElement("section");
  g("initVenueMapCallout")(callout, { text: deps().text, config: { public: true }, access: "Prédio H-02 · Entrada pelo portão 2" });
  assert.match(textOf(callout), /Prédio H-02 · Entrada pelo portão 2/);
  g("initVenueMapCallout")(callout, { text: deps().text, config: { public: true } });
  assert.match(textOf(callout), /A entrada, o estacionamento/);
});

test("tem o link do mapa oficial e escapa texto de ponto", () => {
  const { map, types, text } = deps();
  const html = g("venueCampusMapMarkup")({ map, types, groups: ["arrival"], text, selectedId: "x", zoomed: false, points: [{ id: "x", kind: "gate", group: "arrival", mark: "<b>", x: 10, y: 10, name: "<img src=x onerror=1>", text: "a & b" }] });
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img src=x onerror=1&gt;"));
  assert.match(html, /href="https:\/\/www\.puc-campinas\.edu\.br\/wp-content\/uploads\/2026\/07\/Mapa-PUC-Campus-I-26-2\.pdf"/);
});
