/**
 * Testes da cena de fundos de tela do telão (docs/js/components/mural-scenes/mural-wallpapers-scene.js): três celulares com os fundos da lista, QR que leva à página (com o destino injetado), a passada
 * seguinte traz outros fundos, e a cena não aparece sem destino, sem fundos ou sem QR.
 *   node --test --test-force-exit DevFestIA/tools/dom/mural-wallpapers-scene.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/mural.js", "data/mock-links.js", "data/mock-photo.js", "data/mock-speakers.js", "data/mock-talks.js", "data/schedule-builder.js", "data/schedule.js", "data/wallpapers.js", "data/wall-config.js", "data/mural-config.js", "data/venue-photos.js", "data/mural-scenes.js", "components/mural-scenes/mural-scene-kit.js", "components/mural-scenes/mural-wallpapers-scene.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const MURAL_SKIP = g("MURAL_SKIP");
const html = markup => { const el = document.createElement("div"); el.innerHTML = markup; return el; };
const list = n => Array.from({ length: n }, (_, i) => ({ id: `w${i}`, title: `Fundo ${i}`, image: `img/w${i}.jpg` }));
const params = { kicker: "Fundos de tela", heading: "A fênix agora mora no seu celular", hint: "Escaneie e escolha o seu fundo", path: "fundos.html?origem=telao" };
const lock = { time: "9:41", date: "sábado, 28 de novembro" };
const build = ({ wallpapers = list(6), target = { url: "https://site/fundos.html?origem=telao", label: "" }, qr = { available: () => true, draw: () => {} }, preloaded = [] } = {}) =>
  g("createWallpapersScene")({ repository: { getAll: () => wallpapers }, preload: async url => { preloaded.push(url); }, targets: { resolve: () => target }, qr, lock });

test("mostra três celulares com os fundos, o relógio da tela de bloqueio, o título e o QR do destino", async () => {
  const drawn = [];
  const preloaded = [];
  const scene = build({ qr: { available: () => true, draw: (el, text) => drawn.push(text) }, preloaded });
  const prepared = await scene.prepare(params);
  const rendered = scene.render(prepared, params);
  const view = html(rendered.markup);
  assert.equal(view.querySelectorAll(".ms-wp-phone").length, 3);
  assert.match(textOf(view), /A fênix agora mora no seu celular/);
  assert.match(textOf(view), /9:41/);
  assert.match(textOf(view), /Escaneie e escolha o seu fundo/);
  assert.deepEqual([...preloaded], ["img/w0.jpg", "img/w1.jpg", "img/w2.jpg"], "pré-carrega só os três que vai mostrar");
  rendered.mount(view);
  assert.deepEqual([...drawn], ["https://site/fundos.html?origem=telao"]);
});

test("a passada seguinte traz os próximos três fundos (e volta ao começo)", async () => {
  const scene = build();
  const titles = async () => html(scene.render(await scene.prepare(params), params).markup).querySelectorAll("img");
  const first = [...await titles()].map(img => img.getAttribute("alt"));
  const second = [...await titles()].map(img => img.getAttribute("alt"));
  const third = [...await titles()].map(img => img.getAttribute("alt"));
  assert.deepEqual(first, ["Fundo 0", "Fundo 1", "Fundo 2"]);
  assert.deepEqual(second, ["Fundo 3", "Fundo 4", "Fundo 5"]);
  assert.deepEqual(third, first);
});

test("não aparece sem destino, sem fundos; falha sem a biblioteca de QR", async () => {
  assert.equal(await build({ target: null }).prepare(params), MURAL_SKIP);
  assert.equal(await build({ wallpapers: [] }).prepare(params), MURAL_SKIP);
  await assert.rejects(async () => build({ qr: { available: () => false } }).prepare(params), /QR indisponível/);
});

test("o dado: duas passadas por volta, só com a página pública, e o QR leva com ?origem=telao", () => {
  const scenes = g("muralScenesRepository").getAll().filter(scene => scene.type === "wallpapers");
  assert.equal(scenes.length, 2);
  assert.ok(scenes.every(scene => scene.params.path === "fundos.html?origem=telao"));
  assert.ok(scenes.every(scene => scene.enabled === g("WALLPAPERS_CONFIG").public));
});
