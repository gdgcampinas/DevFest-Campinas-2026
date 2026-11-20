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
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/wallpapers.js", "components/wallpapers.js", "features/release-gate.js", "features/wallpapers.js", "features/wallpaper-band.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const wallpapers = g("wallpapersRepository").getAll();
const text = g("wallpaperTextsRepository").getAll();
const bandConfig = g("wallpaperBandConfigRepository").getAll();

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

test("os fundos mais novos vêm sempre primeiro; na mesma data vale a ordem da lista", () => {
  const ids = Array.from(wallpapers, item => item.id); // Array.from: os dados vêm de outro contexto (vm), o deepEqual estrito compara o protótipo
  assert.deepEqual(ids.slice(0, 3), ["fenix-e-o-caderno", "fenix-na-lagoa-do-taquaral", "torre-do-castelo-em-rosa"]);
  assert.equal(ids[3], "guarda-chuvas");
  const dates = Array.from(wallpapers, item => item.added);
  assert.deepEqual(dates, [...dates].sort().reverse(), "datas em ordem decrescente");
  assert.ok(wallpapers.every(item => /^\d{4}-\d{2}-\d{2}$/.test(item.added)), "todo fundo tem a data");
});

test("faixa da home: liberada em PROD nos dados entregues; com `public` falso só o modo DEV a mostra", () => {
  const band = g("initWallpaperBand");
  const section = document.createElement("section");
  const hidden = { ...bandConfig, public: false };
  assert.equal(bandConfig.public, true, "liberada em produção");
  assert.equal(band(section, { config: hidden, wallpapers, text, devMode: false }), false);
  assert.equal(section.hidden, true);
  assert.equal(section.innerHTML, "");
  assert.equal(band(section, { config: hidden, wallpapers, text, devMode: true }), true);
  assert.equal(section.hidden, false);
  assert.equal(band(section, { config: { ...bandConfig, public: true }, wallpapers, text, devMode: false }), true, "liberada vale pra todo mundo");
  assert.equal(band(section, { config: { ...bandConfig, public: true }, wallpapers: [], text, devMode: false }), false, "sem fundos não aparece");
});

test("faixa da home: os celulares são os mais novos, levam à página de fundos e o botão diz quantos fundos existem", () => {
  const section = document.createElement("section");
  g("initWallpaperBand")(section, { config: { ...bandConfig, public: true }, wallpapers, text });
  const titles = [...section.querySelectorAll(".wp-card strong")].map(el => el.textContent);
  assert.deepEqual(titles, Array.from(wallpapers.slice(0, bandConfig.phones), item => item.title));
  assert.ok([...section.querySelectorAll(".wp-phone")].every(link => link.getAttribute("href") === bandConfig.href && !link.hasAttribute("target")), "celular leva à página, na mesma aba");
  assert.equal(section.querySelector(".wp-card .chip-btn"), null, "sem botão de baixar na faixa: quem baixa é a página");
  const cta = section.querySelector(".wp-band-cta a");
  assert.equal(cta.getAttribute("href"), "fundos.html?origem=home");
  assert.match(cta.textContent, new RegExp(`Ver os ${wallpapers.length} fundos`));
  assert.match(textOf(section), new RegExp(`${wallpapers.length} fundos de tela do evento`));
  assert.ok(!section.innerHTML.includes("{n}") && !section.innerHTML.includes("undefined"));
});

test("a página de fundos continua com o botão de baixar em cada cartão depois de reaproveitar a moldura do celular", () => {
  const section = document.createElement("section");
  g("renderWallpapers")(section, { config: { public: true }, wallpapers, text });
  assert.equal(section.querySelectorAll(".wp-card").length, wallpapers.length);
  assert.equal(section.querySelectorAll(".wp-card a[download]").length, wallpapers.length);
  assert.ok([...section.querySelectorAll(".wp-phone")].every(link => link.target === "_blank" && link.rel === "noopener"));
});
