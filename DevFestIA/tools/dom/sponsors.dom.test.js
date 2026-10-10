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

const site = loadSite({ scripts: [...SITE_BASE, "data/mock-links.js", "data/mock-logo.js", "data/sponsors.js", "data/sponsor-tiers.js", "components/sponsor-card.js", "features/sponsors.js"] });
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

test("nome em texto só quando o card não tem descrição; o logo leva o nome no alt (sem repetir)", () => {
  const box = document.createElement("div");
  box.innerHTML = site.get("sponsorLogoMarkup")({ name: "Marca X", link: "https://x.test/", imageUrl: "x.webp", description: "Texto" });
  assert.equal(box.querySelector(".sponsor-name"), null, "com descrição o nome não se repete em texto");
  assert.equal(box.querySelector("img").getAttribute("alt"), "Marca X");
  box.innerHTML = site.get("sponsorLogoMarkup")({ name: "Marca X", link: "https://x.test/", imageUrl: "x.webp", description: "Texto" }, { showDescription: false });
  assert.equal(box.querySelector(".sponsor-desc"), null);
  assert.equal(textOf(box.querySelector(".sponsor-name")), "Marca X", "sem descrição o nome aparece");
  box.innerHTML = site.get("sponsorLogoMarkup")({ name: "Comunidade", link: "https://c.test/", imageUrl: "c.webp" });
  assert.equal(textOf(box.querySelector(".sponsor-name")), "Comunidade", "comunidade parceira (sem descrição no dado) mostra o nome");
});

test("cada cota leva o data-tier pro CSS e o Apoio não mostra descrição; cota desconhecida vira slug do nome", () => {
  const html = tier => { const d = document.createElement("div"); d.innerHTML = site.get("sponsorTierMarkup")(tier); return d; };
  const element = { name: "A", link: "https://a.test/", imageUrl: "a.webp", description: "Descrição" };
  const master = html({ tier: "Master", elements: [element] });
  assert.equal(master.querySelector(".sponsor-tier").dataset.tier, "master");
  assert.ok(master.querySelector(".sponsor-desc"));
  const apoio = html({ tier: "Apoio", elements: [element] });
  assert.equal(apoio.querySelector(".sponsor-tier").dataset.tier, "apoio");
  assert.equal(apoio.querySelector(".sponsor-desc"), null, "Apoio é só logo e nome");
  assert.equal(html({ tier: "Parceria Ouro!", elements: [element] }).querySelector(".sponsor-tier").dataset.tier, "parceria-ouro");
});

test("em produção (antes da revelação) só as marcas `public` aparecem; cota sem nenhuma pública some", () => {
  const publicTiers = site.get("publicSponsorTiers");
  const tiers = [
    { tier: "Master", elements: [{ name: "Real", public: true }] },
    { tier: "Senior", elements: [{ name: "Mock" }] },
    { tier: "Apoio", elements: [{ name: "Outra real", public: true }, { name: "Mock 2" }] },
  ];
  assert.equal(JSON.stringify(publicTiers(tiers).map(tier => [tier.tier, tier.elements.map(e => e.name)])), JSON.stringify([["Master", ["Real"]], ["Apoio", ["Outra real"]]]));
  const real = site.get("sponsorsRepository").getAll();
  const shown = publicTiers(real).flatMap(tier => tier.elements.map(e => e.name));
  assert.equal(JSON.stringify(shown), JSON.stringify(["Google Developer Groups"]), "hoje só o Master (GDG) está liberado em produção");
});
