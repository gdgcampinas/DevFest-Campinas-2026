/**
 * Rotas /DEV/ e a chave de fora do ar (`DEV_ROUTES_ENABLED` em docs/DEV/dev-loader.js): cada página de /DEV/ passa pelo loader e aponta para uma página real do site,
 * e a chave decide entre mandar para o site normal (false) ou carregar o modo DEV (true). `?lineup=1` não depende dela.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const DOCS = path.join(__dirname, "../../../docs");
const DEV_DIR = path.join(DOCS, "DEV");
const LOADER = "dev-loader.js";
const loaderSource = fs.readFileSync(path.join(DEV_DIR, LOADER), "utf8");
const wrappers = fs.readdirSync(DEV_DIR).filter(file => file.endsWith(".html"));

/** Roda o loader numa página de mentira e devolve o que ele fez (redirecionou? gravou o modo DEV? buscou a página?). */
function runLoader({ enabled, target = "grade.html", search = "", hash = "" }) {
  const calls = { replaced: null, stored: null, fetched: null };
  const source = loaderSource.replace(/var DEV_ROUTES_ENABLED = (true|false);/, `var DEV_ROUTES_ENABLED = ${enabled};`);
  vm.runInNewContext(source, {
    document: { currentScript: { dataset: { target } } },
    location: { search, hash, replace: url => { calls.replaced = url; } },
    sessionStorage: { setItem: (key, value) => { calls.stored = [key, value]; } },
    fetch: url => { calls.fetched = url; return new Promise(() => {}); },
    MutationObserver: class {},
  });
  return calls;
}

test("a chave existe como true/false e vem DESLIGADA (DEV fora do ar)", () => {
  const match = loaderSource.match(/var DEV_ROUTES_ENABLED = (true|false);/);
  assert.ok(match, "falta `var DEV_ROUTES_ENABLED = true|false;` no dev-loader.js");
  assert.equal(match[1], "false");
});

test("toda página de /DEV/ usa o loader e aponta para uma página real do site", () => {
  assert.ok(wrappers.length > 0);
  for (const file of wrappers) {
    const html = fs.readFileSync(path.join(DEV_DIR, file), "utf8");
    const target = html.match(/<script src="dev-loader\.js" data-target="([^"]+)"><\/script>/)?.[1];
    assert.ok(target, `${file} não usa o dev-loader.js`);
    assert.ok(fs.existsSync(path.join(DOCS, target)), `${file} aponta para ${target}, que não existe`);
  }
});

test("desligada: manda para a mesma página do site normal, com query e âncora, sem ligar o modo DEV", () => {
  const calls = runLoader({ enabled: false, target: "sorteio.html", search: "?telao=1", hash: "#roda" });
  assert.equal(calls.replaced, "../sorteio.html?telao=1#roda");
  assert.equal(calls.stored, null);
  assert.equal(calls.fetched, null);
});

test("ligada: grava o modo DEV e busca a página real, sem redirecionar", () => {
  const calls = runLoader({ enabled: true });
  assert.deepEqual(calls.stored, ["devfest-campinas-2026:dev-mode", "1"]);
  assert.equal(calls.fetched, "../grade.html");
  assert.equal(calls.replaced, null);
});
