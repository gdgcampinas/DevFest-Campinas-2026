/**
 * Confere os arquivos que as páginas carregam (docs/*.html): todo `<script src>` e `<link href>` local existe e cada arquivo tem o MESMO `?v=N` em todas as páginas que o usam. O `?v=` é o que faz o
 * navegador de quem já visitou buscar o arquivo novo: versões diferentes entre páginas deixam uma delas com arquivo velho em cache (a regra já está nas armadilhas do handoff, agora o CI confere).
 *   node --test DevFestIA/tools/dom/page-assets.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const pages = fs.readdirSync(DOCS).filter(name => name.endsWith(".html"));
const references = pages.flatMap(page => [...fs.readFileSync(path.join(DOCS, page), "utf8").matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)(?:\?v=(\d+))?"/g)].map(match => ({ page, file: match[1], version: match[2] ?? null })));

test("todo script e folha de estilo local carregado por uma página existe no repositório (menos o schedule.dev.js, que é opcional de propósito)", () => {
  const missing = references.filter(({ file }) => !file.endsWith("schedule.dev.js") && !fs.existsSync(path.join(DOCS, file)));
  assert.deepEqual(missing, []);
});

test("cada arquivo tem o mesmo ?v=N em todas as páginas que o carregam", () => {
  const byFile = new Map();
  references.filter(({ version }) => version !== null).forEach(({ page, file, version }) => {
    if (!byFile.has(file)) byFile.set(file, new Map());
    byFile.get(file).set(version, [...(byFile.get(file).get(version) ?? []), page]);
  });
  const mismatches = [...byFile].filter(([, versions]) => versions.size > 1).map(([file, versions]) => `${file}: ${[...versions].map(([version, list]) => `v${version} em ${list.join(", ")}`).join(" | ")}`);
  assert.deepEqual(mismatches, []);
});
