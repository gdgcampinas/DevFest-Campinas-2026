/**
 * Teste de TELA do menu da área de admin (docs/js/features/admin-nav.js + components/admin-nav.js): os links vêm do dado, a seção atual fica em destaque, o texto é escapado e as três telas de
 * moderação que têm o menu por cima carregam o necessário e apontam pra seção certa.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-nav.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const boot = () => loadSite({ scripts: [...SITE_BASE, "data/admin-sections.js", "components/admin-nav.js", "features/admin-nav.js"], html: `<!doctype html><html><body><nav id="adminNav" data-admin-current="fotos"></nav></body></html>` });

test("o menu tem uma seção por item do dado, na ordem, com o id depois do #", () => {
  const site = boot();
  site.get("mountAdminNav")();
  const links = [...site.document.querySelectorAll("#adminNav a")];
  assert.deepEqual(links.map(link => textOf(link)), ["Visão geral", "Telão", "Fotos", "Palestras", "Atalhos"]);
  assert.deepEqual(links.map(link => link.getAttribute("href")), ["admin.html#visao-geral", "admin.html#telao", "admin.html#fotos", "admin.html#palestras", "admin.html#atalhos"]);
  site.window.close();
});

test("a seção do data-admin-current fica em destaque (e só ela)", () => {
  const site = boot();
  site.get("mountAdminNav")();
  const current = [...site.document.querySelectorAll("#adminNav a[aria-current]")];
  assert.equal(current.length, 1);
  assert.equal(textOf(current[0]), "Fotos");
  assert.ok(current[0].classList.contains("chip-btn--primary"));
  site.window.close();
});

test("dentro do admin (base vazia) os links são só #seção e setCurrent troca o destaque sem refazer a página", () => {
  const site = boot();
  const nav = site.get("initAdminNav")(site.document.getElementById("adminNav"), { sections: site.get("adminSectionsRepository").getAll(), base: "", current: "telao" });
  assert.equal(site.document.querySelector("#adminNav a").getAttribute("href"), "#visao-geral");
  nav.setCurrent("palestras");
  assert.equal(textOf(site.document.querySelector("#adminNav a[aria-current]")), "Palestras");
  site.window.close();
});

test("sem o elemento do menu na página, mountAdminNav não faz nada", () => {
  const site = loadSite({ scripts: [...SITE_BASE, "data/admin-sections.js", "components/admin-nav.js", "features/admin-nav.js"] });
  assert.equal(site.get("mountAdminNav")(), null);
  site.window.close();
});

test("o título da seção vem do dado e é escapado (nada vira HTML)", () => {
  const site = boot();
  const markup = site.get("adminNavMarkup")({ sections: [{ id: "x", title: "<b>oi</b>" }], current: "x" });
  const holder = site.document.createElement("div");
  holder.innerHTML = markup;
  assert.equal(holder.querySelector("b"), null);
  assert.match(textOf(holder), /<b>oi<\/b>/);
  site.window.close();
});

test("as telas de moderação com menu: elemento, dado, componente e feature carregados, e a seção certa em destaque", () => {
  const pages = { "moderacao.html": "palestras", "mural-controle.html": "telao", "mural-fotos.html": "fotos" };
  for (const [page, section] of Object.entries(pages)) {
    const html = fs.readFileSync(path.join(DOCS, page), "utf8");
    assert.match(html, new RegExp(`id="adminNav"[^>]*data-admin-current="${section}"`), `${page}: menu com a seção ${section}`);
    for (const script of ["js/data/admin-sections.js", "js/components/admin-nav.js", "js/features/admin-nav.js"]) assert.ok(html.includes(`src="${script}`), `${page}: falta ${script}`);
    assert.ok(html.includes('href="css/admin.css'), `${page}: falta o css do admin`);
    assert.ok(html.includes("css/styles.css"), `${page}: .chip-btn vem do styles.css`);
    const pageScript = fs.readFileSync(path.join(DOCS, "js", "pages", page.replace(".html", ".js")), "utf8");
    assert.match(pageScript, /mountAdminNav\(\)/, `${page}: a página monta o menu`);
  }
});
