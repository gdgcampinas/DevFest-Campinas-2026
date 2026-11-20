/**
 * Testa a seção "Nossa história" da página principal e a cena "10 anos de DevFest" do telão (data/history.js, components/history.js, features/history.js,
 * components/mural-scenes/mural-history-scene.js): os dados apontam pra fotos que existem, a seção nasce só em DEV, os números vêm do selo de aniversário e a cena
 * nunca mostra uma foto sozinha.
 *   node --test --test-force-exit DevFestIA/tools/dom/history.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/mural.js", "data/anniversary.js", "data/history.js", "components/number-template.js", "components/history.js", "features/release-gate.js", "features/anniversary.js", "features/history.js", "components/mural-scenes/mural-scene-kit.js", "components/mural-scenes/mural-history-scene.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const config = g("historyConfigRepository").getAll();
const text = g("historyTextsRepository").getAll();
const photos = g("historyPhotosRepository");
const milestones = g("historyMilestonesRepository").getAll();
const mosaic = g("historyMosaicRepository").getAll();
const anniversary = g("anniversaryConfigRepository").getAll();
const MURAL_SKIP = g("MURAL_SKIP");
const mount = () => document.createElement("section");
const init = (el, extra = {}) => g("initHistory")(el, { config, text, milestones, mosaic, photos, anniversary, eventYear: 2026, ...extra });

test("os dados apontam pra fotos que existem: arquivo no disco, marco e mosaico com id válido, mínimo de fotos no mosaico", () => {
  photos.getAll().forEach(photo => assert.ok(fs.existsSync(path.join(DOCS, photo.file)), photo.file));
  milestones.forEach(milestone => assert.ok(photos.getById(milestone.photo), `${milestone.id}: foto ${milestone.photo} não existe`));
  mosaic.forEach(id => assert.ok(photos.getById(id), `mosaico: foto ${id} não existe`));
  assert.ok(mosaic.length >= 4, "o telão nunca mostra uma foto sozinha");
  assert.equal(new Set(milestones.map(item => item.id)).size, milestones.length, "ids de marco únicos");
});

test("a seção nasce só em DEV: escondida em produção, visível no modo DEV, liberada vale pra todos e sem marcos não aparece", () => {
  const el = mount();
  assert.equal(config.public, false);
  assert.equal(init(el, { devMode: false }), false);
  assert.equal(el.hidden, true);
  assert.equal(el.innerHTML, "");
  assert.equal(init(el, { devMode: true }), true);
  assert.equal(init(el, { config: { ...config, public: true } }), true);
  assert.equal(init(el, { config: { ...config, public: true }, milestones: [] }), false);
});

test("a linha do tempo mostra um cartão por marco com foto, ano e os números do selo em destaque; o mosaico traz as fotos", () => {
  const el = mount();
  init(el, { devMode: true });
  const cards = el.querySelectorAll(".history-milestone");
  assert.equal(cards.length, milestones.length);
  assert.deepEqual(Array.from(cards, card => card.querySelector(".history-year").textContent).slice(0, 3), ["2013", "2014", "2016"]);
  assert.match(textOf(el.querySelector(".history-head h2")), /Nossa história: 13 anos de comunidade/);
  assert.deepEqual(Array.from(el.querySelectorAll(".history-head h2 b"), b => b.textContent), ["13"]);
  assert.match(textOf(el.querySelector('[data-milestone="hoje"] h3')), /10 anos de DevFest/);
  assert.equal(el.querySelectorAll(".history-mosaic img").length, mosaic.length);
  assert.ok(Array.from(el.querySelectorAll("img")).every(img => img.getAttribute("alt")), "toda foto tem texto alternativo");
  assert.ok(!el.innerHTML.includes("{") && !el.innerHTML.includes("undefined"));
});

test("a foto com crédito mostra a legenda 'Foto: nome' e as sem crédito não mostram nada", () => {
  const el = mount();
  init(el, { devMode: true });
  const credits = Array.from(el.querySelectorAll(".history-credit"), item => item.textContent);
  assert.ok(credits.length > 0 && credits.every(item => item === "Foto: eLelis Fotografia"));
  assert.equal(el.querySelector('[data-milestone="fundacao"] .history-credit'), null);
  assert.equal(el.querySelector('[data-milestone="hoje"] .history-credit'), null);
});

test("cena do telão: mosaico com todas as fotos carregadas, título com os anos em destaque e o agradecimento com o ano da fundação", async () => {
  const preloaded = [];
  const scene = g("createHistoryScene")({ photos, mosaic, text, years: { community: 13, devfest: 10 }, founded: 2013, preload: async url => { preloaded.push(url); } });
  const ready = await scene.prepare();
  assert.equal(preloaded.length, mosaic.length, "pré-carrega cada foto do mosaico");
  const view = document.createElement("div");
  view.innerHTML = scene.render(ready).markup;
  assert.equal(view.querySelectorAll(".ms-history-tile img").length, mosaic.length);
  assert.match(textOf(view.querySelector(".ms-title")), /10 anos de DevFest em Campinas/);
  assert.match(textOf(view.querySelector(".ms-history-thanks")), /desde 2013/);
});

test("cena do telão: com menos de 4 fotos carregadas ela some (nunca uma foto sozinha) e foto que não carrega fica de fora", async () => {
  const failing = new Set(mosaic.slice(0, mosaic.length - 3).map(id => photos.getById(id).file));
  const scene = g("createHistoryScene")({ photos, mosaic, text, years: { community: 13, devfest: 10 }, founded: 2013, preload: async url => { if (failing.has(url)) throw new Error("falhou"); } });
  assert.equal(await scene.prepare(), MURAL_SKIP);
  const partial = g("createHistoryScene")({ photos, mosaic, text, years: { community: 13, devfest: 10 }, founded: 2013, preload: async url => { if (url === photos.getById(mosaic[0]).file) throw new Error("falhou"); } });
  const ready = await partial.prepare();
  assert.equal(ready.length, mosaic.length - 1);
});

test("a cena 'historia' do telão nasce desligada junto com a seção da home e o telão carrega tudo que ela usa", () => {
  const scenes = fs.readFileSync(path.join(DOCS, "js/data/mural-scenes.js"), "utf8");
  assert.match(scenes, /id: "historia"[^\n]*enabled: HISTORY_CONFIG\.public/);
  const telao = fs.readFileSync(path.join(DOCS, "telao.html"), "utf8");
  ["data/history.js", "data/anniversary.js", "components/number-template.js", "features/anniversary.js", "components/mural-scenes/mural-history-scene.js"].forEach(file => assert.ok(telao.includes(`js/${file}`), file));
});
