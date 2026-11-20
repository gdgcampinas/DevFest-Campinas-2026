/**
 * Testa o selo de aniversário da página principal (data/anniversary.js, components/anniversary-badge.js, features/anniversary.js): os anos saem da data do evento,
 * o selo nasce só em DEV e some se os marcos não fizerem sentido.
 *   node --test --test-force-exit DevFestIA/tools/dom/anniversary.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/anniversary.js", "components/anniversary-badge.js", "features/release-gate.js", "features/anniversary.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const config = g("anniversaryConfigRepository").getAll();
const text = g("anniversaryTextsRepository").getAll();
const mount = () => document.createElement("div");

test("os anos saem da data do evento: 2026 é 13 anos de GDG Campinas e 10 de DevFest", () => {
  const years = g("anniversaryYears")({ eventYear: 2026, communityFounded: config.communityFounded, firstDevFest: config.firstDevFest });
  assert.equal(years.community, 13);
  assert.equal(years.devfest, 10);
  assert.equal(g("anniversaryYears")({ eventYear: 2027, ...config }).devfest, 11, "o selo acompanha a próxima edição sozinho");
});

test("nasce só em DEV: escondido em produção, visível no modo DEV, e liberado vale pra todo mundo", () => {
  const init = g("initAnniversaryBadge");
  const el = mount();
  assert.equal(config.public, false);
  assert.equal(init(el, { config, text, eventYear: 2026, devMode: false }), false);
  assert.equal(el.hidden, true);
  assert.equal(el.innerHTML, "");
  assert.equal(init(el, { config, text, eventYear: 2026, devMode: true }), true);
  assert.equal(el.hidden, false);
  assert.equal(init(el, { config: { ...config, public: true }, text, eventYear: 2026, devMode: false }), true);
});

test("o selo diz os dois números e o texto escapado, sem sobra de {community} ou {devfest}", () => {
  const el = mount();
  g("initAnniversaryBadge")(el, { config: { ...config, public: true }, text, eventYear: 2026 });
  assert.equal(textOf(el.querySelector(".anniversary-badge")), "13 anos de GDG Campinas · 10 anos de DevFest");
  assert.ok(!el.innerHTML.includes("{") && !el.innerHTML.includes("undefined"));
  assert.ok(el.querySelector(".anniversary-badge svg, .anniversary-badge .icon"), "ícone");
});

test("marco no futuro (ano do evento antes do marco) não mostra selo com número zero ou negativo", () => {
  const el = mount();
  assert.equal(g("initAnniversaryBadge")(el, { config: { ...config, public: true }, text, eventYear: 2016 }), false, "em 2016 o primeiro DevFest tem 0 anos");
  assert.equal(el.hidden, true);
});
