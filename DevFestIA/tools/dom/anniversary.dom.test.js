/**
 * Testa o selo de aniversário da página principal (data/anniversary.js, components/anniversary-badge.js, features/anniversary.js): os anos saem da data do evento,
 * o selo nasce só em DEV e some se os marcos não fizerem sentido.
 *   node --test --test-force-exit DevFestIA/tools/dom/anniversary.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/anniversary.js", "components/number-template.js", "components/anniversary-badge.js", "features/release-gate.js", "features/anniversary.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const config = g("anniversaryConfigRepository").getAll();
const text = g("anniversaryTextsRepository").getAll();
const mount = () => document.createElement("div");

test("os anos saem da data do evento: 2026 é 17 anos de GDG Campinas (desde 2009) e 10 de DevFest", () => {
  const years = g("anniversaryYears")({ eventYear: 2026, communityFounded: config.communityFounded, firstDevFest: config.firstDevFest });
  assert.equal(years.community, 17);
  assert.equal(years.devfest, 10);
  assert.equal(g("anniversaryYears")({ eventYear: 2027, ...config }).devfest, 11, "o selo acompanha a próxima edição sozinho");
});

test("liberado em PROD nos dados entregues; a regra: com `public` falso só o modo DEV vê, e liberado vale pra todo mundo", () => {
  const init = g("initAnniversaryBadge");
  const el = mount();
  const hidden = { ...config, public: false };
  assert.equal(config.public, true, "liberado em produção");
  assert.equal(init(el, { config: hidden, text, eventYear: 2026, devMode: false }), false);
  assert.equal(el.hidden, true);
  assert.equal(el.innerHTML, "");
  assert.equal(init(el, { config: hidden, text, eventYear: 2026, devMode: true }), true);
  assert.equal(el.hidden, false);
  assert.equal(init(el, { config: { ...config, public: true }, text, eventYear: 2026, devMode: false }), true);
});

test("o selo diz os dois números e o texto escapado, sem sobra de {community} ou {devfest}", () => {
  const el = mount();
  g("initAnniversaryBadge")(el, { config: { ...config, public: true }, text, eventYear: 2026 });
  assert.equal(textOf(el.querySelector(".anniversary-badge")), "17 anos de GDG Campinas · 10 anos de DevFest");
  const link = el.querySelector("a.anniversary-badge");
  assert.ok(link, "o selo é um link");
  assert.equal(link.getAttribute("href"), "historia.html", "leva à página de história");
  assert.deepEqual(Array.from(el.querySelectorAll(".anniversary-badge b"), number => number.textContent), ["17", "10"], "os números vêm em destaque");
  assert.ok(!el.innerHTML.includes("{") && !el.innerHTML.includes("undefined"));
  assert.ok(el.querySelector(".anniversary-badge svg, .anniversary-badge .icon"), "ícone");
});

test("marco no futuro (ano do evento antes do marco) não mostra selo com número zero ou negativo", () => {
  const el = mount();
  assert.equal(g("initAnniversaryBadge")(el, { config: { ...config, public: true }, text, eventYear: 2016 }), false, "em 2016 o primeiro DevFest tem 0 anos");
  assert.equal(el.hidden, true);
});

test("o texto do selo é escapado e só os números viram HTML", () => {
  const markup = g("anniversaryBadgeMarkup")("<img src=x onerror=alert(1)> {community} anos", { community: 13 });
  assert.ok(!markup.includes("<img"));
  assert.match(markup, /&lt;img/);
  assert.match(markup, /<b>13<\/b>/);
});

test("o selo vai em toda página: showAnniversaryBadge cria o espaço depois da linha de data e local e o preenche", () => {
  document.body.innerHTML = '<div class="meta-line" id="headerMeta"></div><nav id="siteNav"></nav>';
  const shown = g("showAnniversaryBadge")({ after: document.getElementById("headerMeta"), config: { ...config, public: true }, text, eventYear: 2026, href: "historia.html" });
  assert.equal(shown, true);
  assert.equal(document.getElementById("headerMeta").nextElementSibling.id, "anniversaryBadge");
  assert.equal(document.querySelectorAll("#anniversaryBadge a.anniversary-badge").length, 1);
  assert.equal(g("showAnniversaryBadge")({ after: null, config, text, eventYear: 2026 }), false, "sem cabeçalho não faz nada");
});
