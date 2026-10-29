/**
 * Guarda da varredura mobile (2026-10-29): o bloco de alvos de toque do styles.css dá 44px de altura aos controles com texto próprio, e a faixa de links do rodapé quebra linha em vez de estourar a tela.
 * O jsdom não calcula layout; por isso o teste confere a regra no CSS. A medição real é feita no navegador a 375px (ver handoff).
 *   node --test --test-force-exit DevFestIA/tools/dom/touch-targets.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const docs = path.join(__dirname, "../../../docs");
const css = fs.readFileSync(path.join(docs, "css/styles.css"), "utf8");
const block = css.slice(css.lastIndexOf("@media (pointer:coarse), (max-width:640px)"));
const MIN_HEIGHT_SELECTORS = [".site-nav a", ".lang-switcher a", ".chip-btn", ".cta", ".featured-speakers-cta", ".venue-actions .go", ".venue-link", ".ts-link", ".vm-zoom", ".social-links a", ".footer-col a"];

test("no celular os controles com texto chegam a 44px de altura", () => {
  const start = block.indexOf(`${MIN_HEIGHT_SELECTORS[0]},`);
  const rule = block.slice(start, block.indexOf("}", start));
  assert.match(rule, /min-height:44px/);
  for (const selector of MIN_HEIGHT_SELECTORS) assert.ok(rule.includes(selector), `${selector} saiu da regra de 44px`);
});

test("a faixa de links do rodapé quebra linha e o selo do LinkedIn tem 44px", () => {
  assert.match(block, /\.social-links\{flex-wrap:wrap/);
  assert.match(block, /\.social-icon\{width:44px;height:44px\}/);
});

test("todas as páginas carregam a mesma versão do styles.css", () => {
  const versions = new Set();
  for (const page of fs.readdirSync(docs).filter(name => name.endsWith(".html"))) {
    const found = fs.readFileSync(path.join(docs, page), "utf8").match(/css\/styles\.css\?v=(\d+)/);
    if (found) versions.add(found[1]);
  }
  assert.equal(versions.size, 1, `versões diferentes do styles.css: ${[...versions]}`);
});
