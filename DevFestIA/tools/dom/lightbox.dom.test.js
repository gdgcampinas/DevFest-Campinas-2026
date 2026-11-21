/**
 * Testa o "ver a foto maior" (components/lightbox.js, features/lightbox.js): clicar abre o modal com a foto grande e a legenda, as setas e o teclado passam pras vizinhas (voltando ao
 * começo no fim), foto escondida por filtro fica fora e tudo é escapado. A página de história liga o recurso.
 *   node --test --test-force-exit DevFestIA/tools/dom/lightbox.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "components/modal.js", "components/lightbox.js", "features/lightbox.js"] });
const { document, window } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const text = { label: "Foto ampliada", prev: "Foto anterior", next: "Próxima foto" };
const gallery = () => {
  document.body.innerHTML = `<section id="g">${["a", "b", "c"].map(id => `<figure><img src="${id}.webp" alt="Foto ${id} <b>"><small class="history-event">Evento ${id}</small></figure>`).join("")}<figure hidden><img src="x.webp" alt="escondida"></figure></section>`;
  const root = document.getElementById("g");
  g("initLightbox")(root, { selector: "img", createModal: g("createModal"), text, describe: img => ({ title: img.closest("figure").querySelector("small").textContent, caption: img.alt }) });
  return root;
};
const shown = () => document.querySelector("#lightboxModal .lightbox-figure img").getAttribute("alt");

test("a regra do passa-passa: avança, volta e dá a volta nas pontas", () => {
  const next = g("nextLightboxIndex");
  assert.equal(next(0, 1, 3), 1);
  assert.equal(next(2, 1, 3), 0);
  assert.equal(next(0, -1, 3), 2);
  assert.equal(next(1, 0, 3), 1);
});

test("clicar numa foto abre o modal com a foto grande, a legenda e as setas", () => {
  const root = gallery();
  root.querySelectorAll("img")[1].click();
  const modal = document.getElementById("lightboxModal");
  assert.equal(modal.hidden, false);
  assert.ok(modal.classList.contains("lightbox"));
  assert.equal(modal.getAttribute("aria-label"), "Foto ampliada");
  assert.match(document.querySelector("#lightboxModal img").getAttribute("src"), /b\.webp$/);
  assert.equal(textOf(modal.querySelector("figcaption strong")), "Evento b");
  assert.equal(modal.querySelectorAll("[data-lightbox-step]").length, 2);
  assert.equal(modal.querySelector(".lightbox-prev").getAttribute("aria-label"), "Foto anterior");
});

test("as setas e o teclado passam pras vizinhas, dão a volta e deixam de fora a foto escondida", () => {
  const root = gallery();
  root.querySelectorAll("img")[0].click();
  document.querySelector(".lightbox-next").click();
  assert.match(shown(), /Foto b/);
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight" }));
  assert.match(shown(), /Foto c/);
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight" }));
  assert.match(shown(), /Foto a/, "dá a volta, e a foto [hidden] nunca aparece");
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft" }));
  assert.match(shown(), /Foto c/);
});

test("a legenda e o texto alternativo vão escapados; com uma foto só não há setas; fechar esconde o modal", () => {
  const markup = g("lightboxMarkup")({ src: 'a"><script>x</script>.webp', alt: "<img onerror=1>", title: "<b>t</b>", caption: "<i>c</i>", hasNav: false, text });
  assert.ok(!markup.includes("<script") && !markup.includes("<img onerror") && !markup.includes("<i>"));
  assert.ok(!markup.includes("lightbox-nav"));
  const root = gallery();
  root.querySelectorAll("img")[0].click();
  document.querySelector("#lightboxModal .modal-close").click();
  assert.equal(document.getElementById("lightboxModal").hidden, true);
});

test("a página de história liga o recurso nas fotos da linha do tempo e da galeria e carrega os scripts", () => {
  const page = fs.readFileSync(path.join(DOCS, "historia.html"), "utf8");
  ["components/modal.js", "components/lightbox.js", "features/lightbox.js"].forEach(file => assert.ok(page.includes(`js/${file}`), file));
  const script = fs.readFileSync(path.join(DOCS, "js/pages/historia.js"), "utf8");
  assert.match(script, /initLightbox\(sectionEl, \{\s*selector: "\.history-milestone img, \.history-mosaic img"/);
});
