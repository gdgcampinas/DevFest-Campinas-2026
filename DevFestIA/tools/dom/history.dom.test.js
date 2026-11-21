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
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/mural.js", "data/anniversary.js", "data/history-config.js", "data/history.js", "components/number-template.js", "components/history.js", "features/release-gate.js", "features/anniversary.js", "features/history.js", "components/mural-scenes/mural-scene-kit.js", "components/mural-scenes/mural-history-scene.js"] });
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
const createRotation = () => { const cursors = new Map(); return { next(key, count) { const index = (cursors.get(key) ?? 0) % count; cursors.set(key, (index + 1) % count); return index; } }; };
const scene = (extra = {}) => g("createHistoryScene")({ photos, mosaic, text, years: { community: 17, devfest: 10 }, founded: 2009, perPage: 8, rotation: createRotation(), preload: async () => {}, ...extra });
const mount = () => document.createElement("section");
const init = (el, extra = {}) => g("initHistory")(el, { config, text, milestones, mosaic, photos, anniversary, eventYear: 2026, ...extra });

test("os dados apontam pra fotos que existem: arquivo no disco, marco e mosaico com id válido, mínimo de fotos no mosaico", () => {
  photos.getAll().forEach(photo => assert.ok(fs.existsSync(path.join(DOCS, photo.file)), photo.file));
  milestones.forEach(milestone => assert.ok(milestone.photo ? photos.getById(milestone.photo) : milestone.badge, `${milestone.id}: precisa de foto que existe ou de badge`));
  mosaic.forEach(id => assert.ok(photos.getById(id), `mosaico: foto ${id} não existe`));
  assert.ok(mosaic.length >= 4, "o telão nunca mostra uma foto sozinha");
  assert.equal(new Set(milestones.map(item => item.id)).size, milestones.length, "ids de marco únicos");
  assert.equal(new Set(mosaic).size, mosaic.length, "foto repetida na galeria");
  const used = new Set([...mosaic, ...milestones.map(item => item.photo)]);
  photos.getAll().forEach(photo => assert.ok(used.has(photo.id), `foto ${photo.id} não aparece em lugar nenhum`));
});

test("liberada em PROD nos dados entregues; a regra: com `public` falso só o modo DEV vê, liberada vale pra todos e sem marcos não aparece", () => {
  const el = mount();
  const hidden = { ...config, public: false };
  assert.equal(config.public, true, "liberada em produção");
  assert.equal(init(el, { config: hidden, devMode: false }), false);
  assert.equal(el.hidden, true);
  assert.equal(el.innerHTML, "");
  assert.equal(init(el, { config: hidden, devMode: true }), true);
  assert.equal(init(el, { config: { ...config, public: true } }), true);
  assert.equal(init(el, { config: { ...config, public: true }, milestones: [] }), false);
});

test("a linha do tempo mostra um cartão por marco com foto, ano e os números do selo em destaque; o mosaico traz as fotos", () => {
  const el = mount();
  init(el, { devMode: true });
  const cards = el.querySelectorAll(".history-milestone");
  assert.equal(cards.length, milestones.length);
  assert.deepEqual(Array.from(cards, card => card.querySelector(".history-year").textContent).slice(0, 5), ["2009", "2013", "2014", "2016", "2017"]);
  assert.match(textOf(el.querySelector(".history-head h2")), /Nossa história: 17 anos de comunidade/);
  assert.deepEqual(Array.from(el.querySelectorAll(".history-head h2 b"), b => b.textContent), ["17"]);
  assert.match(textOf(el.querySelector('[data-milestone="hoje"] h3')), /10 anos de DevFest/);
  assert.equal(el.querySelectorAll(".history-mosaic img").length, mosaic.length, "todas as fotos estão na página (as extras dentro de 'Ver todas')");
  assert.equal(el.querySelectorAll(":scope > .history-mosaic figure").length, config.galleryVisible, "só as primeiras aparecem direto");
  const more = el.querySelector(".history-more");
  assert.ok(more, "o resto fica em 'Ver todas as fotos'");
  assert.equal(more.querySelectorAll("figure").length, mosaic.length - config.galleryVisible);
  assert.match(textOf(more.querySelector(".history-more-open")), new RegExp(`Ver todas as ${mosaic.length} fotos`));
  assert.ok(Array.from(el.querySelectorAll("img")).every(img => img.getAttribute("alt")), "toda foto tem texto alternativo");
  assert.ok(!el.innerHTML.includes("{") && !el.innerHTML.includes("undefined"));
});

test("a história começa em 2009 com o GTUG: marco sem foto mostra o selo de texto no lugar dela e nenhum texto diz 2013 como fundação", () => {
  const el = mount();
  init(el, { devMode: true });
  const first = el.querySelector('[data-milestone="fundacao"]');
  assert.equal(first.querySelector(".history-year").textContent, "2009");
  assert.match(textOf(first.querySelector("h3")), /GTUG Campinas/);
  assert.equal(first.querySelector("img"), null, "sem foto até chegarem as do arquivo");
  assert.equal(first.querySelector(".history-badge").textContent, "GTUG");
  assert.match(textOf(first.querySelector("p")), /julho de 2009/);
  assert.equal(anniversary.communityFounded, 2009);
  assert.match(textOf(el.querySelector(".history-kicker")), /Desde 2009/);
  assert.ok(!/Nasce o GDG Campinas/.test(el.innerHTML));
});

test("o acervo novo (archive: true) só aparece no modo DEV até `archivePublic`: marcos, galeria e filtro seguem a mesma chave", () => {
  const archiveIds = mosaic.filter(id => photos.getById(id).archive);
  assert.ok(archiveIds.length >= 30, "as fotos dos álbuns 2016 a 2019 entraram");
  assert.equal(config.archivePublic, false, "o acervo nasce só em DEV");
  const publicConfig = { ...config, public: true };
  const shown = (extra) => { const el = mount(); init(el, { config: publicConfig, ...extra }); return el; };
  const hidden = shown({ devMode: false });
  assert.equal(hidden.querySelectorAll(".history-mosaic img").length, mosaic.length - archiveIds.length, "em PROD só as fotos antigas");
  assert.equal(hidden.querySelector('[data-milestone="eventos-2018"]'), null);
  const dev = shown({ devMode: true });
  assert.ok(dev.querySelector('[data-milestone="eventos-2018"]') && dev.querySelector('[data-milestone="datafest-2019"]'));
  assert.equal(dev.querySelectorAll(".history-mosaic img").length, mosaic.length);
  const released = shown({ config: { ...publicConfig, archivePublic: true }, devMode: false });
  assert.equal(released.querySelectorAll(".history-mosaic img").length, mosaic.length, "liberado vale pra todo mundo");
  archiveIds.forEach(id => { const photo = photos.getById(id); assert.ok(photo.event && photo.year && photo.kind, `${id}: evento, ano e tipo`); });
});

test("a galeria tem filtro por tipo de evento: DevFest, outros eventos e todas; cada foto do acervo mostra evento e ano", () => {
  const el = mount();
  init(el, { devMode: true });
  const chips = Array.from(el.querySelectorAll(".history-chip"));
  assert.deepEqual(chips.map(chip => chip.dataset.filter), ["all", "devfest", "outros"]);
  assert.equal(chips[0].getAttribute("aria-pressed"), "true");
  const figures = Array.from(el.querySelectorAll(".history-mosaic figure"));
  assert.ok(figures.some(figure => figure.querySelector(".history-event")?.textContent === "UX Day 2017"));
  chips[2].click();
  assert.ok(figures.filter(figure => figure.dataset.kind === "outros").every(figure => !figure.hidden));
  assert.ok(figures.filter(figure => figure.dataset.kind !== "outros").every(figure => figure.hidden), "só os outros eventos ficam");
  assert.equal(el.querySelectorAll(":scope > .history-mosaic figure:not([hidden])").length, figures.filter(figure => figure.dataset.kind === "outros").length, "tudo do filtro fica junto na grade principal");
  assert.equal(el.querySelectorAll(".history-more figure").length, 0, "o 'Ver todas' esvazia e some");
  assert.equal(chips[2].getAttribute("aria-pressed"), "true");
  chips[0].click();
  assert.ok(figures.every(figure => !figure.hidden));
  assert.equal(el.classList.contains("is-filtered"), false);
  assert.equal(el.querySelectorAll(":scope > .history-mosaic figure").length, config.galleryVisible, "cada foto volta ao lugar de antes");
});

test("o telão passa pelo acervo só quando liberado (a página do telão ignora o modo DEV)", () => {
  const mural = fs.readFileSync(path.join(DOCS, "js/pages/mural.js"), "utf8");
  assert.match(mural, /mosaic: historyMosaicRepository\.getAll\(\)\.filter\(id => historyReleased\([^\n]*archivePublic\)\)/);
  assert.equal(g("historyReleased")({ archive: true }, false), false);
  assert.equal(g("historyReleased")({ archive: true }, true), true);
  assert.equal(g("historyReleased")({}, false), true);
});

test("a foto com crédito mostra a legenda 'Foto: nome' e as sem crédito não mostram nada", () => {
  const el = mount();
  init(el, { devMode: true });
  const credits = Array.from(el.querySelectorAll(".history-credit"), item => item.textContent);
  assert.ok(credits.length > 0 && credits.every(item => item === "Foto: eLelis Fotografia"));
  assert.equal(el.querySelector('[data-milestone="fundacao"] .history-credit'), null);
  assert.equal(el.querySelector('[data-milestone="hoje"] .history-credit'), null);
});

test("cena do telão: cada passada mostra uma página de fotos, pré-carrega só ela e o título e o agradecimento vêm com os números em destaque", async () => {
  const preloaded = [];
  const history = scene({ preload: async url => { preloaded.push(url); } });
  const ready = await history.prepare();
  const pageSize = Math.ceil(mosaic.length / Math.ceil(mosaic.length / 8));
  assert.equal(ready.length, pageSize, "a primeira página é a maior");
  assert.ok(pageSize <= 8 && pageSize >= 4);
  assert.deepEqual(Array.from(preloaded), Array.from(mosaic.slice(0, pageSize), id => photos.getById(id).file), "pré-carrega só a página mostrada");
  const view = document.createElement("div");
  view.innerHTML = history.render(ready).markup;
  assert.equal(view.querySelectorAll(".ms-history-tile img").length, pageSize);
  assert.match(textOf(view.querySelector(".ms-title")), /10 anos de DevFest em Campinas/);
  assert.match(textOf(view.querySelector(".ms-history-thanks")), /desde 2009/);
  const grid = view.querySelector(".ms-history-grid").getAttribute("style");
  assert.match(grid, new RegExp(`--cols:4;--rows:${Math.ceil(pageSize / 4)};--rows-tall:${Math.ceil(pageSize / 2)}`), "colunas e linhas pro CSS centrar a última linha");
});

test("cena do telão: as passadas seguem pelas páginas e, ao longo delas, TODAS as fotos da galeria aparecem", async () => {
  const history = scene();
  const seen = new Set();
  const pages = Math.ceil(mosaic.length / 8);
  for (let index = 0; index < pages; index++) {
    const page = await history.prepare();
    assert.notEqual(page, MURAL_SKIP, `a página ${index + 1} não pode sumir`);
    assert.ok(page.length >= 4, "nunca uma foto sozinha");
    page.forEach(photo => seen.add(photo.id));
  }
  assert.deepEqual([...seen].sort(), [...mosaic].sort());
  const again = await history.prepare();
  assert.equal(again[0].id, mosaic[0], "depois da última página volta pra primeira");
});

test("cena do telão: com qualquer total de fotos as páginas ficam equilibradas (diferem em no máximo 1) e nenhuma passa de 8 nem fica com menos de 4", async () => {
  for (const total of [27, 33, 49, 56, 57, 59, 63, 64]) {
    const ids = Array.from(mosaic).concat(Array.from(mosaic), Array.from(mosaic)).slice(0, total);
    const sizes = [];
    const history = scene({ mosaic: ids });
    for (let index = 0; index < Math.ceil(total / 8); index++) sizes.push((await history.prepare()).length);
    assert.ok(Math.max(...sizes) <= 8 && Math.min(...sizes) >= 4 && Math.max(...sizes) - Math.min(...sizes) <= 1, `${total} fotos: ${sizes}`);
    assert.equal(sizes.reduce((sum, size) => sum + size, 0), total);
  }
});

test("cena do telão: página com menos de 4 fotos carregadas some (nunca uma foto sozinha) e foto que não carrega fica de fora", async () => {
  const pageSize = Math.ceil(mosaic.length / Math.ceil(mosaic.length / 8));
  const firstPage = Array.from(mosaic.slice(0, pageSize), id => photos.getById(id).file);
  const failingMost = scene({ preload: async url => { if (firstPage.indexOf(url) > 2) throw new Error("falhou"); } });
  assert.equal(await failingMost.prepare(), MURAL_SKIP);
  const failingOne = scene({ preload: async url => { if (url === firstPage[0]) throw new Error("falhou"); } });
  assert.equal((await failingOne.prepare()).length, pageSize - 1);
  assert.equal(await scene({ mosaic: [] }).prepare(), MURAL_SKIP);
});

test("a cena 'historia' do telão nasce desligada junto com a seção da home e o telão carrega tudo que ela usa", () => {
  const scenes = fs.readFileSync(path.join(DOCS, "js/data/mural-scenes.js"), "utf8");
  assert.match(scenes, /id: "historia"[^\n]*enabled: HISTORY_CONFIG\.public/);
  const telao = fs.readFileSync(path.join(DOCS, "telao.html"), "utf8");
  ["data/history.js", "data/anniversary.js", "components/number-template.js", "features/anniversary.js", "components/mural-scenes/mural-history-scene.js"].forEach(file => assert.ok(telao.includes(`js/${file}`), file));
});

test("o cartão da home leva à página de história, com os anos em destaque, e com `public` falso só o modo DEV o vê", () => {
  const el = mount();
  const teaser = (extra = {}) => g("initHistoryTeaser")(el, { config, text, anniversary, eventYear: 2026, href: "historia.html", ...extra });
  assert.equal(teaser({ config: { ...config, public: false }, devMode: false }), false);
  assert.equal(el.hidden, true);
  assert.equal(el.innerHTML, "");
  assert.equal(teaser({ config: { ...config, public: false }, devMode: true }), true);
  const link = el.querySelector("a.history-teaser-card");
  assert.equal(link.getAttribute("href"), "historia.html");
  assert.match(textOf(link), /Nossa história: 17 anos de comunidade/);
  assert.match(textOf(link), /Conheça a nossa história/);
  assert.deepEqual(Array.from(link.querySelectorAll("b"), b => b.textContent), ["17"]);
  assert.equal(teaser({ config: { ...config, public: true } }), true, "liberado vale pra todo mundo");
});

test("a página de história: antes de liberar mostra 'chega em breve'; o menu só traz o link quando liberado ou em DEV", () => {
  assert.match(textOf(document.createRange().createContextualFragment(g("historySoonMarkup")(text))), /chega em breve/);
  const nav = fs.readFileSync(path.join(DOCS, "js/components/site-nav.js"), "utf8");
  assert.match(nav, /id: "historia"[^\n]*release: \(\) => historyConfigRepository\.getAll\(\)/);
  const page = fs.readFileSync(path.join(DOCS, "historia.html"), "utf8");
  ["data/history-config.js", "data/history.js", "components/history.js", "features/history.js", "pages/historia.js"].forEach(file => assert.ok(page.includes(`js/${file}`), file));
  assert.ok(fs.existsSync(path.join(DOCS, "DEV", "historia.html")), "atalho /DEV/historia.html");
});
