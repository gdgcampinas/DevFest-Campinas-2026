/**
 * Testes do local confirmado do evento (docs/js/features/event-venue.js, data/venue.js): só em DEV até `public: true`; troca nome e endereço de EVENT e traz os links do campus.
 *   node --test --test-force-exit DevFestIA/tools/dom/event-venue.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/venue.js", "features/event-venue.js"] });
test.after(() => site.window.close());
const applyVenue = site.get("applyVenue");
const venue = site.get("venueRepository").getAll();
const newEvent = () => ({ venue: "Local a definir", address: "Campinas, SP", venueConfirmed: false });

test("produção (sem `public`): o local continua a definir", () => {
  const event = newEvent();
  assert.equal(applyVenue(event, { ...venue, public: false }), false);
  assert.equal(event.venue, "Local a definir");
  assert.equal(event.venueConfirmed, false);
});

test("DEV ou `public: true`: o local da PUC entra no EVENT, confirmado, com os links do campus", () => {
  for (const [options, data] of [[{ devMode: true }, { ...venue, public: false }], [{}, { ...venue, public: true }]]) {
    const event = newEvent();
    assert.equal(applyVenue(event, data, options), true);
    assert.match(event.venue, /PUC-Campinas/);
    assert.match(event.address, /Prédio H15.*13086-900/);
    assert.equal(event.venueConfirmed, true);
    assert.equal(event.venueLinks.map(link => link.id).join(), "map,about");
    assert.ok(event.venueLinks.every(link => link.url.startsWith("https://www.puc-campinas.edu.br/")));
  }
});

test("a produção continua sem o local enquanto `public` for false (o dado entregue)", () => {
  assert.equal(venue.public, false);
});
