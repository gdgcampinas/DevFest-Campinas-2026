/**
 * Testes da medição de uso (docs/js/features/analytics.js, components/track-attrs.js): atributos escapados, clique vira evento, o modo DEV não liga o provedor e o mapa, o local e as camisetas são medidos.
 *   node --test --test-force-exit DevFestIA/tools/dom/analytics.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/release-gate.js", "data/venue-map.js", "components/venue-campus-map.js", "features/venue-campus-map.js", "data/analytics.js", "features/analytics.js"] });
const { document, window } = site;
test.after(() => window.close());
const g = name => site.get(name);

test("trackAttrs monta só o que veio preenchido e escapa o valor", () => {
  assert.equal(g("trackAttrs")("map_point", { place: "map", target: "gate2" }), ' data-track-event="map_point" data-track-place="map" data-track-target="gate2"');
  assert.equal(g("trackAttrs")("cta_click", { kind: "buy" }), ' data-track-event="cta_click" data-track-kind="buy"');
  assert.ok(!g("trackAttrs")("x", { target: '"><script>' }).includes("<script>"));
});

test("um clique num elemento marcado vira um evento do provedor injetado", () => {
  const calls = [];
  const adapters = { fake: () => ({ load() {}, event: (name, props) => calls.push([name, props]) }) };
  const root = document.createElement("div");
  root.innerHTML = `<button${g("trackAttrs")("map_zoom", { place: "map" })}>z</button>`;
  const analytics = g("initAnalytics")({ provider: "fake", endpoint: "https://x.test/count" }, { rootEl: root, adapters, debug: false });
  assert.equal(analytics.enabled, true);
  root.querySelector("button").click();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "map_zoom");
  assert.equal(calls[0][1].place, "map");
});

test("no modo DEV (`enabled: false`) o provedor nem é carregado e nada é contado", () => {
  let loaded = false;
  const adapters = { fake: () => ({ load() { loaded = true; }, event() { throw new Error("não deveria contar"); } }) };
  const root = document.createElement("div");
  root.innerHTML = `<button${g("trackAttrs")("map_zoom")}>z</button>`;
  const analytics = g("initAnalytics")({ provider: "fake", endpoint: "https://x.test/count" }, { rootEl: root, adapters, debug: false, enabled: false });
  assert.equal(analytics.enabled, false);
  root.querySelector("button").click();
  assert.equal(loaded, false);
});

test("o mapa mede pino, cartão da lista, zoom e o mapa oficial", () => {
  const el = document.createElement("section");
  g("initVenueCampusMap")(el, { map: g("venueMapRepository").getAll(), points: g("venueMapPointsRepository").getAll(), groups: g("venueMapGroupsRepository").getAll(), types: g("venueMapTypesRepository").getAll(), text: g("venueMapTextsRepository").getAll(), config: { public: true } });
  assert.equal(el.querySelector('.vm-pin[data-map-point="gate2"]').dataset.trackEvent, "map_point");
  assert.equal(el.querySelector('.vm-pin[data-map-point="gate2"]').dataset.trackTarget, "gate2");
  assert.equal(el.querySelector('.vm-card[data-map-point="parking"]').dataset.trackTarget, "parking");
  assert.equal(el.querySelector("[data-map-zoom]").dataset.trackEvent, "map_zoom");
  assert.equal(el.querySelector(".vm-foot a").dataset.trackEvent, "map_official");
});
