/**
 * Testes da página de fundos de tela (docs/js/features/wallpapers.js, components/wallpapers.js, data/wallpapers.js): só em DEV até `public`, um cartão por fundo com o link de baixar, e os arquivos existem.
 *   node --test --test-force-exit DevFestIA/tools/dom/wallpapers.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/wallpapers.js", "components/wallpapers.js", "features/wallpapers.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const wallpapers = g("wallpapersRepository").getAll();
const text = g("wallpaperTextsRepository").getAll();

test("os arquivos de cada fundo (imagem e miniatura) existem", () => {
  assert.ok(wallpapers.length >= 3);
  for (const item of wallpapers) for (const file of [item.image, item.thumb]) assert.ok(fs.existsSync(path.join(DOCS, file)), file);
});

test("a regra: só em DEV até `public` ficar ligado", () => {
  const visible = g("wallpapersVisible");
  assert.equal(visible({ public: false }, { devMode: false }), false);
  assert.equal(visible({ public: false }, { devMode: true }), true);
  assert.equal(visible({ public: true }, { devMode: false }), true);
});

test("em produção (não público): só o aviso 'em breve', sem nenhum fundo", () => {
  const section = document.createElement("section");
  assert.equal(g("renderWallpapers")(section, { config: { public: false }, wallpapers, text, devMode: false }), false);
  assert.match(textOf(section), /chegam em breve/);
  assert.equal(section.querySelector(".wp-card"), null);
});

test("visível: um cartão por fundo, com o botão de baixar (download) e o nome do arquivo", () => {
  const section = document.createElement("section");
  assert.equal(g("renderWallpapers")(section, { config: { public: false }, wallpapers, text, devMode: true }), true);
  const cards = [...section.querySelectorAll(".wp-card")];
  assert.equal(cards.length, wallpapers.length);
  const link = cards[0].querySelector("a[download]");
  assert.equal(link.getAttribute("href"), wallpapers[0].image);
  assert.match(link.getAttribute("download"), /^devfest-campinas-2026-fundo-.*\.jpg$/);
  assert.match(textOf(section), /Baixar fundo/);
  assert.match(textOf(cards[0]), /9:41[\s\S]*28 de novembro/, "relógio e data da tela de bloqueio na prévia");
  assert.equal(section.querySelectorAll(".wp-guide").length, 2, "iPhone e Android");
  assert.equal(section.querySelectorAll(".wp-guide[data-guide=ios] li").length, 3, "passos numerados do iPhone");
});

test("o cabeçalho traz o selo, o título e a frase de apoio", () => {
  const head = document.createElement("section");
  head.innerHTML = g("wallpapersHeadMarkup")(text);
  assert.match(textOf(head), /GRÁTIS PARA BAIXAR[\s\S]*Fundos de tela[\s\S]*Leve o DevFest/);
});
