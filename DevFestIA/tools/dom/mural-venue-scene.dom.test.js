/**
 * Testes da cena "Onde estamos" do telão (docs/js/components/mural-scenes/mural-venue-scene.js): a foto do H-02 em tela cheia com o prédio, o campus, a entrada e o endereço embaixo, foto pedida por id,
 * pré-carga só da foto mostrada, a cena que some sem foto, texto escapado e o dado (só com as fotos públicas, nas fases certas, tudo carregado pelo telão).
 *   node --test DevFestIA/tools/dom/mural-venue-scene.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "features/mural.js", "data/mock-links.js", "data/mock-photo.js", "data/mock-speakers.js", "data/mock-talks.js", "data/schedule-builder.js", "data/schedule.js", "data/wallpapers.js", "data/wall-config.js", "data/mural-config.js", "data/venue.js", "data/venue-photos.js", "data/mural-scenes.js", "components/mural-scenes/mural-scene-kit.js", "components/mural-scenes/mural-venue-scene.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const MURAL_SKIP = g("MURAL_SKIP");
const html = markup => { const el = document.createElement("div"); el.innerHTML = markup; return el; };
const params = { kicker: "Onde estamos" };
const build = ({ photos = g("venuePhotosRepository"), place = g("venueRepository").getAll, preloaded = [] } = {}) =>
  g("createVenueScene")({ photos, place, preload: async url => { preloaded.push(url); } });

test("mostra a foto do H-02 em tela cheia, o rótulo, o prédio, o campus com a entrada e o endereço", async () => {
  const preloaded = [];
  const scene = build({ preloaded });
  const view = html(scene.render(await scene.prepare(params), params).markup);
  assert.deepEqual([...preloaded], ["assets/img/campus/predio-h02.webp"], "pré-carrega só a foto que vai mostrar");
  assert.match(view.querySelector(".ms-art-img").getAttribute("src"), /predio-h02\.webp/);
  assert.match(view.querySelector(".ms-art-img").getAttribute("alt"), /H-02/);
  assert.match(textOf(view.querySelector(".ms-kicker")), /Onde estamos/);
  assert.match(textOf(view.querySelector(".ms-venue-title")), /Prédio H-02/);
  assert.match(textOf(view.querySelector(".ms-venue-line")), /PUC-Campinas, Campus I · Entrada pelo portão 2/);
  assert.match(textOf(view.querySelector(".ms-venue-address")), /Av\. Reitor Benedito José Barreto Fonseca/);
});

test("a foto pode ser escolhida por id e o ponto que não corta vem do dado", async () => {
  const scene = build();
  const withPhoto = { ...params, photo: "predio-h13", focus: "10% 20%" };
  const view = html(scene.render(await scene.prepare(withPhoto), withPhoto).markup);
  assert.match(view.querySelector(".ms-art-img").getAttribute("src"), /predio-h13\.webp/);
  assert.match(view.querySelector(".ms-art-img").getAttribute("style"), /--focus:10% 20%/);
  const normal = html(scene.render(await scene.prepare(params), params).markup);
  assert.match(normal.querySelector(".ms-art-img").getAttribute("style"), /--focus:50% 60%/);
});

test("sem foto a cena não aparece; sem prédio, entrada ou endereço a faixa mostra só o que há; texto é escapado", async () => {
  assert.equal(await build({ photos: { featured: () => null, getById: () => null } }).prepare(params), MURAL_SKIP);
  assert.equal(await build().prepare({ ...params, photo: "nao-existe" }), MURAL_SKIP);
  const scene = build({ place: () => ({ venue: "<b>PUC</b>" }) });
  const view = html(scene.render(await scene.prepare(params), params).markup);
  assert.equal(textOf(view.querySelector(".ms-venue-title")), "<b>PUC</b>", "sem prédio usa o campus, escapado");
  assert.equal(view.querySelector(".ms-venue-line").textContent, "<b>PUC</b>");
  assert.equal(view.querySelector(".ms-venue-address"), null);
  assert.equal(view.querySelector("b"), null);
});

test("o dado: a cena só entra com as fotos públicas, antes e durante o evento, e o telão carrega tudo que ela usa", () => {
  const scene = g("muralScenesRepository").getById("onde-estamos");
  assert.equal(scene.type, "venue");
  assert.equal(scene.enabled, g("VENUE_PHOTOS_CONFIG").public);
  assert.deepEqual([...scene.requires.phases], ["before", "live"]);
  assert.ok(scene.seconds > 0 && scene.params.kicker);
  const telao = fs.readFileSync(path.join(DOCS, "telao.html"), "utf8");
  ["js/data/venue.js", "js/data/venue-photos.js", "js/components/mural-scenes/mural-venue-scene.js"].forEach(file => assert.ok(telao.includes(`"${file}?v=`), `telao.html não carrega ${file}`));
  assert.ok(telao.indexOf("js/data/venue-photos.js") < telao.indexOf("js/data/mural-scenes.js"), "a config das fotos vem antes das cenas");
  ["mural-controle.html", "admin.html"].forEach(page => {
    const source = fs.readFileSync(path.join(DOCS, page), "utf8");
    assert.ok(source.indexOf("js/data/venue-photos.js") !== -1 && source.indexOf("js/data/venue-photos.js") < source.indexOf("js/data/mural-scenes.js"), `${page} precisa da config das fotos antes das cenas`);
  });
  assert.match(fs.readFileSync(path.join(DOCS, "js/pages/mural.js"), "utf8"), /venue: createVenueScene\(/, "o telão registra o desenhador da cena");
});
