/**
 * Garante que toda página que carrega o `js/app.js` carrega também o que ele usa já no cabeçalho (`escape-html.js` e `track-attrs.js`), antes dele. Sem isso a página fica em branco (bug de 2026-10-23 no código de conduta e no quiz).
 *   node --test --test-force-exit DevFestIA/tools/dom/page-scripts.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const docs = path.join(__dirname, "../../../docs");
const REQUIRED_BEFORE_APP = ["js/components/escape-html.js", "js/components/track-attrs.js"];
const pages = fs.readdirSync(docs).filter(name => name.endsWith(".html"));

for (const page of pages) {
  const html = fs.readFileSync(path.join(docs, page), "utf8");
  if (!/src="js\/app\.js/.test(html)) continue;
  test(`${page}: carrega o que o app.js usa, antes dele`, () => {
    const appAt = html.search(/src="js\/app\.js/);
    for (const file of REQUIRED_BEFORE_APP) {
      const at = html.indexOf(`src="${file}`);
      assert.ok(at !== -1, `${page} não carrega ${file}`);
      assert.ok(at < appAt, `${page}: ${file} precisa vir antes do app.js`);
    }
  });
}
