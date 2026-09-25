/**
 * Harness dos testes de TELA (jsdom): carrega os scripts do site, na mesma ordem e no mesmo escopo global que o navegador
 * (cada arquivo é um <script> comum, então `const` e `function` de um enxergam os do outro), dentro de uma janela de mentira.
 * As features do site recebem tudo por parâmetro (`deps()`, `config`, `now`, repositories), então o teste injeta substitutos e
 * confere o que a pessoa vê e o que foi gravado, sem Firebase nem emulador. Roda no CI: `npm ci --prefix DevFestIA/tools` e
 * `node --test DevFestIA/tools/dom/*.test.js`.
 *
 *   const site = loadSite({ scripts: [...SITE_BASE, "features/talk-questions.js"] });
 *   const initTalkQuestions = site.get("initTalkQuestions");   // qualquer function ou const dos scripts carregados
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const SITE_JS = path.join(__dirname, "..", "..", "..", "docs", "js");

/** O que quase toda tela usa: repository, textos (t/tn), ícones, escape de HTML e os repositories locais persistidos. */
const SITE_BASE = [
  "data/repository.js",
  "data/i18n/languages.js",
  "data/i18n/en.js",
  "features/i18n-core.js",
  "features/i18n.js",
  "data/icons.js",
  "components/icon.js",
  "components/escape-html.js",
  "data/persisted-set-repository.js",
  "data/persisted-value-repository.js",
];

/** Trecho das páginas que os scripts de tela assumem existir (`runAfterModules`, `getParam` vêm do app.js, que não é carregado aqui). */
const PAGE_HELPERS = `
  function runAfterModules(task) { task(); }
  function getParam(name) { return new URLSearchParams(location.search).get(name); }
`;

function loadSite({ scripts, html = "<!doctype html><html><body></body></html>", url = "http://localhost/?lineup=1", globals = {}, helpers = PAGE_HELPERS }) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const context = dom.getInternalVMContext();
  Object.assign(dom.window, globals);
  const run = (code, filename = "test") => new vm.Script(code, { filename }).runInContext(context);
  run(helpers, "page-helpers");
  scripts.forEach(script => run(fs.readFileSync(path.join(SITE_JS, script), "utf8"), script));
  return {
    window: dom.window,
    document: dom.window.document,
    /** Valor de qualquer nome global dos scripts (function ou const). */
    get: name => run(name, `get:${name}`),
    run,
  };
}

/** Armazenamento de mentira pros repositories persistidos (`storage` injetado). */
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: key => (data.has(key) ? data.get(key) : null), setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key), dump: () => Object.fromEntries(data) };
}

/** Deixa rodar o que está pendente (promises e timers curtos) antes de conferir a tela. */
const flush = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const settle = async (times = 4) => { for (let i = 0; i < times; i++) await flush(); };

/** Texto visível de um elemento, sem quebras de linha soltas (jsdom não tem innerText). */
const textOf = element => element.textContent.replace(/\s+/g, " ").trim();

module.exports = { loadSite, SITE_BASE, memoryStorage, flush, settle, textOf };
