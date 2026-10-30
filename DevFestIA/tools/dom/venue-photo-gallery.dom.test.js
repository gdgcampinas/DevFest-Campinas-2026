/**
 * Testes da galeria de fotos do campus (docs/js/data/venue-photos.js, components/venue-photo-gallery.js, features/venue-photo-gallery.js, features/release-gate.js): só em DEV até `public`, a foto do H-02
 * primeiro e em destaque, foto ampliada com anterior/próxima, link para o site do campus, texto escapado e todo arquivo existente com legenda traduzida.
 *   node --test DevFestIA/tools/dom/venue-photo-gallery.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/modal.js", "features/release-gate.js", "data/venue-photos.js", "components/venue-photo-gallery.js", "features/venue-photo-gallery.js"] });
const { document, window } = site;
test.after(() => window.close());
const g = name => site.get(name);
const photos = () => g("venuePhotosRepository").ordered();
const link = { label: "Conheça o Campus I no site da PUC-Campinas", url: "https://www.puc-campinas.edu.br/campus-i/" };
const mount = (config, devMode, extra = {}) => {
  document.getElementById("venuePhotoModal")?.remove(); // cada galeria monta o seu modal, na primeira foto aberta
  const el = document.createElement("section");
  document.body.append(el);
  const shown = g("initVenuePhotoGallery")(el, { photos: photos(), text: g("venuePhotosTextsRepository").getAll(), link, config, devMode, ...extra });
  return { el, shown };
};
const press = key => document.dispatchEvent(new window.KeyboardEvent("keydown", { key }));

test("o dado: 10 fotos, ids únicos, só uma em destaque (o H-02, primeiro) e cada arquivo existe com legenda", () => {
  const list = g("venuePhotosRepository").getAll();
  assert.equal(list.length, 10);
  assert.equal(new Set(list.map(photo => photo.id)).size, list.length);
  assert.deepEqual([...list.filter(photo => photo.featured).map(photo => photo.id)], ["h02"]);
  assert.equal(photos()[0].id, "h02");
  assert.match(photos()[0].caption, /H-02/);
  list.forEach(photo => {
    assert.ok(photo.caption.trim(), `${photo.id} sem legenda`);
    assert.ok(fs.existsSync(path.join(DOCS, photo.file)), `${photo.id}: falta o arquivo ${photo.file}`);
    if (photo.thumb) assert.ok(fs.statSync(path.join(DOCS, photo.thumb)).size < fs.statSync(path.join(DOCS, photo.file)).size / 2, `${photo.id}: a miniatura precisa ser bem mais leve que a foto`);
    else assert.ok(photo.featured, `${photo.id}: só a foto em destaque dispensa miniatura`);
  });
  assert.equal(g("venuePhotosRepository").featured().id, "h02");
});

test("só as fotos do H-02 dizem que é o prédio do evento (as outras não prometem um prédio que não é)", () => {
  const claims = g("venuePhotosRepository").getAll().filter(photo => /H-02/.test(photo.caption)).map(photo => photo.id);
  assert.deepEqual([...claims], ["h02"]);
});

test("não aparece enquanto não for público; em DEV ou `public: true` aparece com uma foto por item, o H-02 em destaque", () => {
  const hidden = mount({ public: false }, false);
  assert.equal(hidden.shown, false);
  assert.equal(hidden.el.hidden, true);
  assert.equal(hidden.el.innerHTML, "");
  const dev = mount({ public: false }, true);
  assert.equal(dev.shown, true);
  assert.equal(dev.el.hidden, false);
  assert.equal(dev.el.querySelectorAll(".vp-tile").length, 10);
  assert.equal(dev.el.querySelectorAll(".vp-item--featured").length, 1);
  assert.equal(dev.el.querySelector(".vp-item--featured .vp-tile").dataset.photo, "h02");
  assert.equal(dev.el.querySelector(".vp-tile").dataset.photo, "h02", "o destaque vem primeiro");
  assert.equal(mount({ public: true }, false).shown, true);
  assert.match(textOf(dev.el.querySelector(".vp-head")), /Conheça o Campus I/);
});

test("a grade usa a miniatura leve (a foto em destaque, a grande) e a foto ampliada usa a grande", () => {
  const { el } = mount({ public: true }, false);
  const srcOf = id => el.querySelector(`[data-photo="${id}"] img`).getAttribute("src");
  assert.match(srcOf("h02"), /^assets\/img\/campus\/predio-h02\.webp$/);
  assert.match(srcOf("aerea-ampla"), /^assets\/img\/campus\/thumbs\/aerea-ampla\.webp$/);
  el.querySelector('[data-photo="aerea-ampla"]').click();
  assert.match(document.querySelector("#venuePhotoModal img").getAttribute("src"), /^assets\/img\/campus\/aerea-ampla\.webp$/);
});

test("cada foto tem texto alternativo (a legenda), carrega só quando chega perto e o botão diz o que faz", () => {
  const { el } = mount({ public: true }, false);
  el.querySelectorAll(".vp-tile").forEach(tile => {
    const img = tile.querySelector("img");
    assert.ok(img.getAttribute("alt").length > 5);
    assert.equal(img.getAttribute("loading"), "lazy");
    assert.match(tile.getAttribute("aria-label"), /^Ampliar a foto: /);
  });
});

test("o botão leva ao site do campus, em outra aba e sem janela de origem; sem link o botão não existe", () => {
  const { el } = mount({ public: true }, false);
  const anchor = el.querySelector(".vp-link");
  assert.equal(anchor.getAttribute("href"), link.url);
  assert.equal(anchor.getAttribute("target"), "_blank");
  assert.match(anchor.getAttribute("rel"), /noopener/);
  assert.match(textOf(anchor), /site da PUC-Campinas/);
  assert.equal(mount({ public: true }, false, { link: null }).el.querySelector(".vp-link"), null);
});

test("tocar numa foto abre ela ampliada com a legenda e o contador; anterior e próxima andam e voltam ao começo", () => {
  const { el } = mount({ public: true }, false);
  const modal = () => document.getElementById("venuePhotoModal");
  assert.equal(modal(), null, "o modal só nasce na primeira foto aberta");
  el.querySelector('[data-photo="aerea-ampla"]').click();
  assert.equal(modal().hidden, false);
  assert.match(textOf(modal()), /Vista aérea do Campus I, entre os prédios e o estacionamento/);
  assert.match(textOf(modal()), /Foto 3 de 10/);
  modal().querySelector('[data-photo-step="1"]').click();
  assert.match(textOf(modal()), /Foto 4 de 10/);
  modal().querySelector('[data-photo-step="-1"]').click();
  modal().querySelector('[data-photo-step="-1"]').click();
  assert.match(textOf(modal()), /Foto 2 de 10/);
  press("ArrowLeft");
  press("ArrowLeft");
  assert.match(textOf(modal()), /Foto 10 de 10/, "antes da primeira volta para a última");
  press("ArrowRight");
  assert.match(textOf(modal()), /Foto 1 de 10/);
  assert.match(textOf(modal()), /Prédio H-02/);
  press("Escape");
  assert.equal(modal().hidden, true);
  press("ArrowRight");
  assert.equal(modal().hidden, true, "com o modal fechado as setas não abrem nada");
});

test("deslizar o dedo para o lado troca de foto; um toque curto não troca", () => {
  const { el } = mount({ public: true }, false);
  el.querySelector('[data-photo="h02"]').click();
  const modal = document.getElementById("venuePhotoModal");
  const fire = (type, x) => { const event = new window.Event(type, { bubbles: true }); event.changedTouches = [{ clientX: x }]; modal.dispatchEvent(event); };
  fire("touchstart", 200); fire("touchend", 120);
  assert.match(textOf(modal), /Foto 2 de 10/, "para a esquerda vai para a próxima");
  fire("touchstart", 100); fire("touchend", 190);
  assert.match(textOf(modal), /Foto 1 de 10/, "para a direita volta");
  fire("touchstart", 100); fire("touchend", 120);
  assert.match(textOf(modal), /Foto 1 de 10/, "movimento curto não conta");
});

test("com uma foto só não há anterior nem próxima", () => {
  const only = [photos()[0]];
  const html = g("venuePhotoViewMarkup")({ photos: only, index: 0, text: g("venuePhotosTextsRepository").getAll() });
  assert.ok(!/data-photo-step/.test(html));
  assert.ok(!/Foto 1 de 1/.test(html));
});

test("texto de foto é escapado e a galeria sem fotos some", () => {
  const html = g("venuePhotoGalleryMarkup")({ photos: [{ id: "x", file: 'a"b.webp', caption: "<img src=x onerror=1>" }], text: g("venuePhotosTextsRepository").getAll(), link: null });
  assert.ok(!/<img src=x/.test(html));
  assert.match(html, /&lt;img src=x onerror=1&gt;/);
  assert.equal(mount({ public: true }, false, { photos: [] }).shown, false);
});

test("a página Como chegar carrega a galeria (folha, seção e scripts) e o app.js a traduz", () => {
  const html = fs.readFileSync(path.join(DOCS, "local.html"), "utf8");
  ["css/venue-photo-gallery.css", "js/data/venue-photos.js", "js/components/venue-photo-gallery.js", "js/features/venue-photo-gallery.js"].forEach(file => assert.ok(html.includes(`"${file}?v=`), `local.html não carrega ${file}`));
  assert.match(html, /id="venuePhotos"[^>]*hidden/);
  const app = fs.readFileSync(path.join(DOCS, "js/app.js"), "utf8");
  assert.ok(app.includes("venuePhotosRepository.getAll()") && app.includes("venuePhotosTextsRepository.getAll()"));
});
