/**
 * Testes de TELA do patrocínio Master (docs/js/data/sponsors.js, components/sponsor-card.js): o Master é o Google Developer Groups com o logo
 * OFICIAL (arquivo em docs/assets/brand, nunca redesenhado), o link da comunidade e a descrição; o card mostra o logo na caixa branca com o nome como alt.
 *   node --test --test-force-exit DevFestIA/tools/dom/sponsors.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/mock-links.js", "data/mock-logo.js", "data/sponsors.js", "components/sponsor-card.js"] });
const { window, document } = site;
test.after(() => window.close());

test("Master é o Google Developer Groups, com o logo oficial que existe no repositório", () => {
  const master = site.get("sponsorsRepository").getByTier("Master");
  assert.equal(master.elements.length, 1);
  const [gdg] = master.elements;
  assert.equal(gdg.name, "Google Developer Groups");
  assert.equal(gdg.link, "https://gdg.community.dev/");
  assert.match(gdg.description, /GDG Campinas/);
  assert.ok(fs.existsSync(path.join(__dirname, "../../../docs", gdg.imageUrl)), `logo ${gdg.imageUrl} existe`);
});

test("card do Master mostra o logo (alt com o nome), o link externo seguro e o texto", () => {
  const [gdg] = site.get("sponsorsRepository").getByTier("Master").elements;
  const box = document.createElement("div");
  box.innerHTML = site.get("sponsorLogoMarkup")(gdg);
  const link = box.querySelector("a.sponsor-item");
  assert.equal(link.getAttribute("href"), "https://gdg.community.dev/");
  assert.match(link.getAttribute("rel"), /noopener/);
  assert.equal(box.querySelector("img").getAttribute("alt"), "Google Developer Groups");
  assert.match(textOf(box), /Comunidade global de desenvolvedores/);
});
