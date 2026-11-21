/**
 * Testa a HISTÓRIA COMPLETA no telão (features/history-story.js, components/mural-scenes/mural-history-views.js e mural-history-scene.js): páginas por evento com o nome, cartão do marco
 * (com o selo GTUG sem foto), destaque em tela cheia com a foto grande, a volta completa em ordem de ano com o tempo de cada passo, e a liberação pela chave `storyPublic`.
 *   node --test --test-force-exit DevFestIA/tools/dom/history-story.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/mural.js", "data/anniversary.js", "data/history-config.js", "data/history.js", "components/number-template.js", "features/anniversary.js", "features/history-story.js", "components/mural-scenes/mural-scene-kit.js", "components/mural-scenes/mural-history-views.js", "components/mural-scenes/mural-history-scene.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const config = g("historyConfigRepository").getAll();
const text = g("historyTextsRepository").getAll();
const photos = g("historyPhotosRepository");
const mosaic = Array.from(g("historyMosaicRepository").getAll());
const highlights = Array.from(g("historyHighlightsRepository").getAll());
const MURAL_SKIP = g("MURAL_SKIP");
const milestones = g("historyMilestoneItems")({ milestones: g("historyMilestonesRepository").getAll(), resolve: id => photos.getById(id) ?? null, showArchive: true });
const createRotation = () => { const cursors = new Map(); return { next(key, count) { const index = (cursors.get(key) ?? 0) % count; cursors.set(key, (index + 1) % count); return index; } }; };
const make = (extra = {}) => g("createHistoryScene")({ photos, mosaic, highlights, milestones, text, years: { community: 17, devfest: 10 }, founded: 2009, perPage: 8, tourSeconds: config.tour, rotation: createRotation(), preload: async () => {}, ...extra });
const view = markup => { const el = document.createElement("div"); el.innerHTML = markup; return el; };
const all = mosaic.map(id => photos.getById(id));

test("balancedChunks: páginas de no máximo perPage que diferem em no máximo 1, sem sobrar página com 1 ou 2 itens", () => {
  const chunks = g("balancedChunks");
  [1, 4, 8, 9, 17, 30, 59, 64, 101].forEach(total => {
    const sizes = Array.from(chunks(Array.from({ length: total }, (_, i) => i), 8), page => page.length);
    assert.ok(Math.max(...sizes) <= 8 && Math.max(...sizes) - Math.min(...sizes) <= 1, `${total}: ${sizes}`);
    assert.equal(sizes.reduce((a, b) => a + b, 0), total);
    if (total >= 9) assert.ok(Math.min(...sizes) >= 4, `${total}: ${sizes}`);
  });
  assert.equal(chunks([], 8).length, 0);
});

test("grupos por evento: um por evento na ordem cronológica, e o que é pequeno ou sem ano vai junto pro 'Mais momentos' no fim", () => {
  const groups = g("historyEventGroups")(all, { minPhotos: 4, moreLabel: text.storyMore });
  const labels = Array.from(groups, group => group.label);
  assert.equal(labels[0], "DevFest 2016");
  assert.equal(labels[labels.length - 1], text.storyMore, "o 'mais momentos' fica no fim");
  assert.ok(!labels.includes("DataFest 2017") && !labels.includes("Encontro na Bosch 2026"), "evento com 1 foto não vira página sozinho");
  assert.ok(groups.every(group => group.photos.length >= 4), "nunca um grupo com menos de 4 fotos");
  assert.equal(groups.reduce((sum, group) => sum + group.photos.length, 0), all.length, "nenhuma foto some");
  const years = Array.from(groups.filter(group => group.year !== 9999), group => group.year);
  assert.deepEqual(years, [...years].sort(), "os anos só sobem");
  const few = g("historyEventGroups")([{ event: "A", year: 2016, id: "1" }, { event: "A", year: 2016, id: "2" }, { event: "A", year: 2016, id: "3" }, { event: "A", year: 2016, id: "4" }, { id: "solta" }], { minPhotos: 4, moreLabel: "mais" });
  assert.equal(few.length, 1, "uma foto solta só não faz página: entra no último grupo");
  assert.equal(few[0].photos.length, 5);
});

test("páginas por evento: cada uma leva o nome do evento, no máximo 8 fotos, e o DevFest 2016 (30 fotos) vira várias", () => {
  const groups = g("historyEventGroups")(all, { minPhotos: 4, moreLabel: text.storyMore });
  const pages = g("historyPages")(groups, 8);
  assert.ok(pages.every(page => page.photos.length >= 4 && page.photos.length <= 8 && page.label));
  assert.ok(pages.filter(page => page.label === "DevFest 2016").length >= 4);
});

test("a volta completa vai em ordem de ano: no mesmo ano o marco, depois os mosaicos, depois os destaques; sem ano no fim; cada passo com o seu tempo", () => {
  const pages = g("historyPages")(g("historyEventGroups")(all, { minPhotos: 4, moreLabel: text.storyMore }), 8);
  const steps = Array.from(g("historyTourSteps")({ milestones, pages, highlights: highlights.map(id => photos.getById(id)), seconds: config.tour }));
  assert.equal(steps[0].kind, "marco");
  assert.equal(steps[0].item.milestone.year, "2009", "começa em 2009, o GTUG");
  assert.equal(steps.filter(step => step.kind === "marco").length, milestones.length);
  assert.equal(steps.filter(step => step.kind === "destaque").length, highlights.length);
  const years = Array.from(steps, step => step.year);
  assert.deepEqual(years, [...years].sort((a, b) => a - b), "os anos só sobem");
  const sameYear = Array.from(steps.filter(step => step.year === 2016), step => step.kind);
  assert.deepEqual(sameYear, [...sameYear].sort((a, b) => ({ marco: 0, mosaico: 1, destaque: 2 })[a] - ({ marco: 0, mosaico: 1, destaque: 2 })[b]), "marco, mosaicos, destaques");
  assert.ok(steps.every(step => step.seconds === config.tour[step.kind]));
  const total = steps.reduce((sum, step) => sum + step.seconds, 0);
  assert.ok(total > 120 && total < 600, `a volta completa leva ${total}s`);
});

test("cena 'evento': a passada mostra o nome do evento no canto e as fotos dele; a próxima passada segue o rodízio", async () => {
  const scene = make();
  const first = await scene.prepare({ view: "evento" });
  const el = view(scene.render(first).markup);
  assert.equal(textOf(el.querySelector(".ms-history-label")), "DevFest 2016");
  assert.equal(el.querySelectorAll(".ms-history-tile img").length, first.page.photos.length);
  assert.match(textOf(el.querySelector(".ms-title")), /10 anos de DevFest em Campinas/);
  const labels = new Set();
  for (let i = 0; i < 30; i++) labels.add((await scene.prepare({ view: "evento" })).page.label);
  assert.ok(labels.has("UX Day 2017") && labels.has("DataFest 2019") && labels.has(text.storyMore), "ao longo das passadas aparecem todos os eventos");
  const flat = view(scene.render(await scene.prepare({})).markup);
  assert.equal(flat.querySelector(".ms-history-label"), null, "o mosaico de antes segue sem nome de evento");
});

test("cena 'marco': o ano gigante, o título e o texto com os números em destaque; o GTUG sem foto mostra o selo; a volta passa por todos", async () => {
  const scene = make();
  const years = [];
  const texts = [];
  let first = null;
  for (let i = 0; i < milestones.length; i++) {
    const prepared = await scene.prepare({ view: "marco" });
    const el = view(scene.render(prepared).markup);
    years.push(textOf(el.querySelector(".ms-history-year")));
    texts.push(textOf(el.querySelector(".ms-history-marco")));
    if (i === 0) first = el;
  }
  assert.equal(years[0], "2009");
  assert.deepEqual(years, Array.from(milestones, item => item.milestone.year), "um marco por passada, na ordem");
  assert.equal(first.querySelector(".ms-history-marco").dataset.kind, "badge");
  assert.equal(textOf(first.querySelector(".ms-history-badge")), "GTUG");
  assert.match(textOf(first.querySelector(".ms-title")), /GTUG Campinas/);
  assert.match(texts[1], /13 de janeiro de 2013/);
  const hoje = milestones.find(item => item.milestone.id === "hoje");
  const todayEl = view(g("historyMarcoViewMarkup")({ ...hoje, years: { community: 17, devfest: 10 } }));
  assert.deepEqual(Array.from(todayEl.querySelectorAll("b"), b => b.textContent), ["10", "17"], "os números do selo em destaque");
  assert.equal((await make({ milestones: [] }).prepare({ view: "marco" })), MURAL_SKIP);
});

test("cena 'destaque': uma foto grande por passada, em ordem, com a legenda do evento e a versão grande quando existe", async () => {
  const preloaded = [];
  const scene = make({ preload: async url => { preloaded.push(url); } });
  const seen = [];
  for (let i = 0; i < highlights.length; i++) {
    const prepared = await scene.prepare({ view: "destaque" });
    const el = view(scene.render(prepared).markup);
    const photo = photos.getById(highlights[i]);
    assert.equal(el.querySelector(".ms-art-img").getAttribute("src"), photo.hd ?? photo.file);
    seen.push(textOf(el.querySelector(".ms-history-caption")));
  }
  assert.equal(seen[0], "DevFest 2016");
  assert.ok(Array.from(preloaded).some(url => url.includes("/hd/")), "pré-carrega a versão grande");
  assert.ok(highlights.every(id => photos.getById(id).hd || !photos.getById(id).archive), "toda foto nova de destaque tem versão grande");
  assert.equal(await make({ preload: async () => { throw new Error("falhou"); } }).prepare({ view: "destaque" }), MURAL_SKIP);
  assert.equal(await make({ highlights: [] }).prepare({ view: "destaque" }), MURAL_SKIP);
});

test("cena 'completa': uma passada só com a duração da soma dos passos, a troca de passo a cada tempo e o relógio parado ao sair", async () => {
  const scene = make();
  const prepared = await scene.prepare({ view: "completa" });
  const rendered = scene.render(prepared);
  const steps = Array.from(prepared.steps);
  assert.equal(rendered.seconds, steps.reduce((sum, step) => sum + step.seconds, 0));
  const el = view(rendered.markup);
  assert.match(textOf(el.querySelector(".ms-history-year")), /2009/);
  const timers = [];
  const dispose = rendered.mount(el, { schedule: (fn, ms) => { const timer = { fn, ms, cancelled: false }; timers.push(timer); return () => { timer.cancelled = true; }; } });
  assert.equal(timers[0].ms, steps[0].seconds * 1000);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  for (let index = 1; index < steps.length; index++) {
    timers[timers.length - 1].fn();
    await flush();
    await flush();
    assert.equal(el.querySelector(".ms-history-tour").dataset.step, String(index), `passo ${index}`);
  }
  assert.ok(el.querySelector(".ms-history-tour .ms"), "o último passo continua na tela");
  const before = timers.length;
  dispose();
  assert.ok(timers[before - 1].cancelled, "ao sair, o próximo passo não dispara mais");
  assert.equal((await make({ milestones: [], highlights: [], mosaic: [] }).prepare({ view: "completa" })), MURAL_SKIP);
});

test("a liberação: a história completa nasce desligada, o mosaico de antes segue ligado, e as cenas entram nos momentos certos", () => {
  const catalog = fs.readFileSync(path.join(DOCS, "js/data/mural-scenes.js"), "utf8");
  assert.equal(config.storyPublic, false, "só ensaio até liberar");
  assert.match(catalog, /id: "historia", [^\n]*enabled: HISTORY_CONFIG\.public && !HISTORY_CONFIG\.storyPublic/);
  ["historia-evento", "historia-marco", "historia-destaque", "historia-completa", "historia-completa-fora"].forEach(id => assert.match(catalog, new RegExp(`id: "${id}", [^\\n]*enabled: HISTORY_CONFIG\\.storyPublic`), id));
  assert.match(catalog, /id: "historia-completa", [^\n]*moments: \["lunch", "back-to-room", "closing"\]/);
  assert.match(catalog, /id: "historia-completa-fora", [^\n]*phases: \["before", "after"\]/);
  const telao = fs.readFileSync(path.join(DOCS, "telao.html"), "utf8");
  ["features/history-story.js", "components/mural-scenes/mural-history-views.js", "components/mural-scenes/mural-history-scene.js"].forEach(file => assert.ok(telao.includes(`js/${file}`), file));
  assert.ok(telao.indexOf("history-story.js") < telao.indexOf("mural-history-scene.js"));
  ["historia.html", "index.html"].forEach(page => assert.ok(fs.readFileSync(path.join(DOCS, page), "utf8").includes("js/features/history-story.js"), `${page} precisa da regra do marco`));
  const mural = fs.readFileSync(path.join(DOCS, "js/pages/mural.js"), "utf8");
  assert.match(mural, /tourSeconds: historyConfig\.tour/);
});

test("os destaques existem: arquivo em disco (normal e grande), ids válidos e uma foto grande de 1920 px nas novas", () => {
  highlights.forEach(id => {
    const photo = photos.getById(id);
    assert.ok(photo, id);
    assert.ok(fs.existsSync(path.join(DOCS, photo.file)), photo.file);
    if (photo.hd) assert.ok(fs.existsSync(path.join(DOCS, photo.hd)), photo.hd);
  });
  assert.equal(new Set(highlights).size, highlights.length);
});
