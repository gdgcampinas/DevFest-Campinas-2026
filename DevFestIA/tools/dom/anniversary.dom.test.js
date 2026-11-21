/**
 * Testa o selo de aniversário da página principal (data/anniversary.js, components/anniversary-badge.js, features/anniversary.js): os anos saem da data do evento,
 * o selo nasce só em DEV e some se os marcos não fizerem sentido.
 *   node --test --test-force-exit DevFestIA/tools/dom/anniversary.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/anniversary.js", "components/number-template.js", "components/anniversary-seal.js", "components/anniversary-badge.js", "features/release-gate.js", "features/anniversary.js"] });
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

test("o selo REDONDO no site fica ao lado do logo do GDG Campinas, no topo, e leva à história; liberado em PROD (com a chave desligada só o modo DEV); a pílula mantém os 17 anos", () => {
  const released = { ...config, public: true };
  const brand = () => { const el = document.createElement("div"); el.id = "brand"; el.innerHTML = '<img class="brand-logo" alt="">'; return el; };
  const show = (el, extra) => g("showAnniversarySeal")({ into: el, config: released, text, eventYear: 2026, href: "historia.html", ...extra });
  assert.equal(config.siteSeal.public, true, "liberado em produção");
  const off = brand();
  assert.equal(show(off, { config: { ...released, siteSeal: { public: false } }, devMode: false }), false);
  assert.equal(off.querySelector(".anniversary-seal"), null, "com a chave desligada, em produção nada");
  const dev = brand();
  assert.equal(show(dev, { config: { ...released, siteSeal: { public: false } }, devMode: true }), true, "no modo DEV aparece");
  const el = brand();
  assert.equal(show(el, {}), true);
  const seal = el.querySelector("a.anniversary-seal");
  assert.equal(seal.getAttribute("href"), "historia.html", "leva à história");
  assert.equal(seal.querySelector("svg").getAttribute("aria-label"), "10 anos de DevFest em Campinas");
  assert.equal(seal.previousElementSibling.className, "brand-logo", "o selo vem logo DEPOIS do logo do GDG, na mesma linha do topo");
  assert.equal(show(brand(), { eventYear: 2016 }), false, "em 2016 o DevFest tem 0 anos");
  assert.equal(show(null, {}), false, "sem o espaço do logo não faz nada");
  const pill = mount();
  g("initAnniversaryBadge")(pill, { config: released, text, eventYear: 2026 });
  assert.equal(textOf(pill.querySelector(".anniversary-badge")), "17 anos de GDG Campinas · 10 anos de DevFest", "a pílula mantém o texto dos 17 anos");
  assert.equal(pill.querySelector(".anniversary-seal"), null, "o selo não repete dentro da pílula");
  const app = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "..", "..", "docs", "js", "app.js"), "utf8");
  assert.match(app, /showAnniversarySeal\(\{ into: document\.getElementById\("brand"\)/);
});

test("o texto do selo cabe na faixa: o arco de cima e o de baixo têm mais espaço do que o texto (letras pequenas o bastante pra não cortar o começo)", () => {
  const markup = g("anniversarySealMarkup")({ years: { devfest: 10 }, firstDevFest: 2016, eventYear: 2026, text: text.seal });
  const top = markup.match(/<text font-size="([\d.]+)"[^>]*letter-spacing="([\d.]+)"[^>]*><textPath href="#sealTop"/);
  assert.ok(top, "arco de cima");
  const arcLength = 56 * ((120 * Math.PI) / 180); // raio 56, de 210 a 330 graus
  const glyphWidth = Number(top[1]) * 0.65; // largura média de uma letra maiúscula em negrito, em proporção do corpo (medida no navegador: 0,61)
  const estimated = text.seal.top.length * (glyphWidth + Number(top[2]));
  assert.ok(estimated < arcLength * 0.95, `o texto (${Math.round(estimated)}) precisa caber no arco (${Math.round(arcLength)})`);
});
