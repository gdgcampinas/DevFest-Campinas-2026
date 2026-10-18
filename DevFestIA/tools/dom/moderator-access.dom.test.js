/**
 * Testes das regras da porta de moderação (docs/js/features/moderator-access.js e features/admin-access.js): quem é moderador, quem é dono, o que a rede fora do ar significa.
 *   node --test --test-force-exit DevFestIA/tools/dom/moderator-access.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/moderator-access-texts.js", "components/escape-html.js", "components/moderator-access.js", "features/moderator-access.js", "features/admin-access.js"] });
test.after(() => site.window.close());
const denied = async () => { throw { code: "permission-denied" }; };
const offline = async () => { throw new Error("sem rede"); };
const ok = async () => ({});

test("leu = true; sem permissão = false; outro erro = null", async () => {
  const probeAllowed = site.get("probeAllowed");
  assert.equal(await probeAllowed(ok), true);
  assert.equal(await probeAllowed(denied), false);
  assert.equal(await probeAllowed(offline), null);
});

test("estado da tela: só moderator false vira 'denied', null vira 'unknown', o resto passa", () => {
  const state = site.get("moderatorAccessState");
  assert.equal(state({ moderator: false }), "denied");
  assert.equal(state({ moderator: null }), "unknown");
  assert.equal(state({ moderator: true }), "allowed");
  assert.equal(state({}), "allowed");
});

test("dono é moderador; moderador comum não é dono; conta de fora não é nada; rede fora do ar não libera ninguém sozinha", async () => {
  const resolve = site.get("resolveAdminAccess");
  assert.deepEqual(JSON.parse(JSON.stringify(await resolve({ probe: ok, probeModerator: denied }))), { owner: true, moderator: true });
  assert.deepEqual(JSON.parse(JSON.stringify(await resolve({ probe: denied, probeModerator: ok }))), { owner: false, moderator: true });
  assert.deepEqual(JSON.parse(JSON.stringify(await resolve({ probe: denied, probeModerator: denied }))), { owner: false, moderator: false });
  assert.deepEqual(JSON.parse(JSON.stringify(await resolve({ probe: offline, probeModerator: offline }))), { owner: null, moderator: null });
});

test("tela de bloqueio: escapa o e-mail e traz a troca de conta; só a de rede traz 'tentar de novo'", () => {
  const markup = site.get("moderatorBlockedMarkup");
  const text = site.get("moderatorAccessTextsRepository").getAll();
  const deniedHtml = markup({ state: "denied", email: "<b>x</b>@gmail.com", text });
  assert.match(deniedHtml, /data-mod-signout/);
  assert.doesNotMatch(deniedHtml, /data-mod-retry/);
  assert.doesNotMatch(deniedHtml, /<b>x/);
  assert.match(markup({ state: "unknown", email: "a@b.com", text }), /data-mod-retry/);
});
