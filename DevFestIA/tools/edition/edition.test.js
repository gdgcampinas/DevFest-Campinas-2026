/**
 * Testa a separação DEV x PROD dos dados (docs/js/data/firebase-config.js): a edição de cada coleção e o espelho com as regras do Firestore.
 *   node --test DevFestIA/tools/edition/edition.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { CURRENT_EDITION, KNOWN_EDITIONS, DEV_EDITION_SUFFIX, ACTIVITY_COLLECTIONS, resolveEdition } = require("../../../docs/js/data/firebase-config.js");
const { PURGEABLE_COLLECTIONS } = require("../purge-test-data/purge-plan.js");

const root = path.join(__dirname, "..", "..", "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("produção grava na edição 2026; o modo DEV grava os dados de atividade em 2026-dev", () => {
  assert.equal(resolveEdition({ collectionName: "checkins" }), "2026");
  assert.equal(resolveEdition({ collectionName: "checkins", devMode: true }), "2026-dev");
  ACTIVITY_COLLECTIONS.forEach(collectionName => assert.equal(resolveEdition({ collectionName, devMode: true }), `${CURRENT_EDITION}${DEV_EDITION_SUFFIX}`, collectionName));
});

test("dado de referência (inscritos, estatísticas, moderadores, recados e o resto do telão) fica sempre na edição de produção, mesmo no DEV", () => {
  ["registrations", "event-stats", "sync-state", "moderators", "mural-wall", "mural-hidden", "mural-control", "waitlist"].forEach(collectionName => {
    assert.equal(resolveEdition({ collectionName, devMode: true }), CURRENT_EDITION, collectionName);
  });
});

test("página só de produção (o telão e os controles dele) ignora o modo DEV", () => {
  assert.equal(resolveEdition({ collectionName: "checkins", devMode: true, productionOnly: true }), "2026");
});

test("toda coleção que a limpeza apaga é de atividade (separada no DEV), e as de atividade são exatamente essas mais os quadros de perguntas", () => {
  PURGEABLE_COLLECTIONS.forEach(collection => assert.ok(ACTIVITY_COLLECTIONS.includes(collection), `${collection} é apagada na limpeza mas não é separada no DEV`));
  const extra = ACTIVITY_COLLECTIONS.filter(collection => !PURGEABLE_COLLECTIONS.includes(collection));
  assert.deepEqual(extra, ["talk-boards"]);
});

test("config x regras: as edições conhecidas são as mesmas na tela (KNOWN_EDITIONS) e nas regras (isKnownEdition)", () => {
  const rules = read("DevFestIA/firebase/firestore.rules");
  const listed = [...rules.match(/function isKnownEdition\(edition\) \{\s*return edition in \[([^\]]*)\];/)[1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(listed, KNOWN_EDITIONS);
});

test("os repositories não fixam a edição: usam `editionFor` (a decisão fica num lugar só)", () => {
  const dir = path.join(root, "docs/js/data");
  fs.readdirSync(dir).filter(file => /repository|repositories/.test(file)).forEach(file => {
    assert.ok(!/edition:\s*CURRENT_EDITION/.test(read(`docs/js/data/${file}`)), `${file} fixa a edição`);
  });
  ["firestore-repository.js", "firestore-document-repository.js"].forEach(file => assert.match(read(`docs/js/data/${file}`), /edition = editionFor\(collectionName\)/, file));
});

test("só as páginas do telão pedem produção, e o link do sorteio em modo telão do admin abre a raiz (edição de produção), nunca /DEV/", () => {
  ["telao.html", "mural-controle.html", "mural-fotos.html"].forEach(page => assert.match(read(`docs/${page}`), /firebase-config\.js\?v=\d+" data-production-only>/, page));
  fs.readdirSync(path.join(root, "docs")).filter(file => file.endsWith(".html") && !["telao.html", "mural-controle.html", "mural-fotos.html"].includes(file)).forEach(page => {
    assert.ok(!/firebase-config\.js[^>]*data-production-only/.test(read(`docs/${page}`)), `${page} não deveria ser só de produção`);
  });
  assert.ok(!/href: "DEV\//.test(read("docs/js/data/admin-sections.js")), "link do admin leva ao /DEV/");
});
