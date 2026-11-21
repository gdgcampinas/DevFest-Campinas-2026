/**
 * Testa o rodapé do telão com o logo dos colchetes do GDG (components/mural-chrome.js, data/brand.js, pages/mural.js): só com `bracketsSrc`, depois do logo do GDG Campinas e de um traço,
 * o arquivo existe, a chave nasce desligada e o ensaio é `?logos=1`.
 *   node --test --test-force-exit DevFestIA/tools/dom/mural-footer-logos.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "components/mural-chrome.js", "data/brand.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const footer = options => { const el = document.createElement("footer"); el.innerHTML = g("muralFooterMarkup")({ logoSrc: "assets/brand/gdg-logo-dark.svg", name: "DevFest Campinas 2026", ...options }); return el; };

test("sem os colchetes o rodapé fica como sempre: logo, nome e relógio", () => {
  const el = footer({});
  assert.equal(el.querySelector(".mf-brackets"), null);
  assert.equal(el.querySelector(".mf-sep"), null);
  assert.ok(el.querySelector(".mf-logo") && el.querySelector(".mf-name") && el.querySelector("[data-clock]"));
});

test("com os colchetes: logo do GDG Campinas, traço, logo dos colchetes e só depois o nome; o endereço é escapado", () => {
  const el = footer({ bracketsSrc: g("brandRepository").getAll().brackets });
  const order = Array.from(el.children, child => child.className);
  assert.deepEqual(order.slice(0, 4), ["mf-logo", "mf-sep", "mf-brackets", "mf-name"]);
  assert.equal(el.querySelector(".mf-brackets").getAttribute("alt"), "Google Developer Groups");
  assert.equal(footer({ bracketsSrc: '"><script>x</script>' }).querySelectorAll("script").length, 0);
});

test("o arquivo dos colchetes existe, tem as quatro cores e o ensaio e a chave estão ligados no telão", () => {
  const file = path.join(DOCS, g("brandRepository").getAll().brackets);
  assert.ok(fs.existsSync(file));
  const svg = fs.readFileSync(file, "utf8");
  ["#ea4335", "#1a73e8", "#34a853", "#fbbc04"].forEach(color => assert.ok(svg.includes(color), color));
  assert.equal(g("telaoFooterConfigRepository").getAll().bracketsPublic, false, "nasce só em ensaio");
  const mural = fs.readFileSync(path.join(DOCS, "js/pages/mural.js"), "utf8");
  assert.match(mural, /params\.get\("logos"\) === "1" \|\| telaoFooterConfigRepository\.getAll\(\)\.bracketsPublic/);
  assert.match(mural, /bracketsSrc: showBrackets \? brandRepository\.getAll\(\)\.brackets : ""/);
  assert.match(fs.readFileSync(path.join(DOCS, "css/mural.css"), "utf8"), /\.mf-brackets\{height:/);
});
