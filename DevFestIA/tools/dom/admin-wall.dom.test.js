/**
 * Testes de TELA da seção Recados do admin (docs/js/features/admin-wall.js, components/admin-wall.js) e do cartão "Recados para aprovar" da visão geral: fila, aprovar, recusar, tirar do ar, devolver,
 * erros, texto da plateia nunca vira HTML. Repository de mentira (nada toca o Firebase).
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-wall.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/wall-config.js", "data/admin-sections.js", "features/mural-live-sources.js", "features/two-tap-confirm.js", "data/brand.js", "components/brand.js", "components/admin-icons.js", "components/initial-avatar.js", "components/admin-card.js", "features/wall-moderation.js", "components/admin-wall.js", "features/admin-wall.js", "features/admin-overview-cards.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const config = g("WALL_CONFIG");
const text = g("adminWallRepository").getAll();
const rules = { groupWallPosts: g("groupWallPosts"), wallStatusFor: g("wallStatusFor") };
const post = (id, status, createdAtMs, extra = {}) => ({ id, status, createdAtMs, text: `recado ${id}`, prompt: "buscar", ...extra });

function mount({ initial = [], updateImpl, listenError } = {}) {
  document.body.innerHTML = `<div id="view"></div>`;
  const updates = [];
  const listeners = [];
  const repository = {
    listen: (filters, onNext, onError) => { listeners.push(filters); if (listenError) onError(listenError); else onNext(initial); return () => listeners.pop(); },
    update: updateImpl ?? (async (id, fields) => { updates.push({ id, fields }); }),
  };
  const root = document.getElementById("view");
  const view = g("initAdminWall")(root, { repository, rules, config, text, formatTime: ms => `h${ms}` });
  const rowsOf = slot => [...root.querySelectorAll(`[data-slot="${slot}"] .ad-note`)].map(row => textOf(row.querySelector(".ad-note-text")));
  return { root, view, updates, listeners, rowsOf };
}

test("três caixas: pendentes do mais antigo ao mais novo, no telão do mais novo ao mais antigo, e recusados e tirados do ar", () => {
  const { rowsOf } = mount({ initial: [post("a", "pending", 30), post("b", "approved", 10), post("c", "pending", 5), post("d", "approved", 20), post("e", "hidden", 1), post("f", "rejected", 2)] });
  assert.deepEqual(rowsOf("pending"), ["recado c", "recado a"]);
  assert.deepEqual(rowsOf("approved"), ["recado d", "recado b"]);
  assert.deepEqual(rowsOf("other"), ["recado f", "recado e"]);
});

test("cada recado mostra a pergunta, o apelido e a hora; os botões seguem o estado (pendente: aprovar e recusar; no ar: tirar do ar; recusado: aprovar; tirado: devolver)", () => {
  const { root } = mount({ initial: [post("a", "pending", 30, { nickname: "Ana" }), post("b", "approved", 10), post("c", "rejected", 5), post("d", "hidden", 4)] });
  const row = id => root.querySelector(`[data-wall-id="${id}"]`).closest(".ad-note");
  assert.match(textOf(row("a").querySelector(".ad-note-meta")), /O que você veio buscar\? · de Ana · h30/);
  const labels = id => [...row(id).querySelectorAll("button")].map(button => textOf(button));
  assert.deepEqual(labels("a"), ["Aprovar", "Recusar"]);
  assert.deepEqual(labels("b"), ["Tirar do ar"]);
  assert.deepEqual(labels("c"), ["Aprovar"]);
  assert.deepEqual(labels("d"), ["Devolver ao telão"]);
  assert.match(textOf(row("c").querySelector(".ad-note-meta")), /recusado$/);
  assert.match(textOf(row("d").querySelector(".ad-note-meta")), /tirado do ar$/);
});

test("aprovar, recusar, tirar do ar e devolver gravam só o estado novo do recado certo", async () => {
  const { root, updates } = mount({ initial: [post("a", "pending", 1), post("b", "pending", 2), post("c", "approved", 3), post("d", "hidden", 4)] });
  for (const [action, id] of [["approve", "a"], ["reject", "b"], ["hide", "c"], ["restore", "d"]]) {
    root.querySelector(`[data-wall-action="${action}"][data-wall-id="${id}"]`).click();
    await waitFor(() => updates.length === ["approve", "reject", "hide", "restore"].indexOf(action) + 1);
    await waitFor(() => !root.querySelector("[data-wall-action]:disabled"));
  }
  assert.deepEqual(JSON.parse(JSON.stringify(updates)), [{ id: "a", fields: { status: "approved" } }, { id: "b", fields: { status: "rejected" } }, { id: "c", fields: { status: "hidden" } }, { id: "d", fields: { status: "approved" } }]);
});

test("enquanto grava um recado o botão dele fica travado (dois toques não gravam duas vezes) e erro de permissão ou de rede vira aviso", async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const { root } = mount({ initial: [post("a", "pending", 1)], updateImpl: async () => { calls++; await gate; throw { code: "permission-denied" }; } });
  const button = () => root.querySelector('[data-wall-action="approve"]');
  button().click();
  assert.ok(button().disabled);
  button().click();
  release();
  await waitFor(() => /não é de moderador/.test(textOf(root.querySelector("[data-slot=message]"))));
  assert.equal(calls, 1);
  assert.equal(button().disabled, false);
  const offline = mount({ initial: [post("a", "pending", 1)], updateImpl: async () => { throw new Error("rede"); } });
  offline.root.querySelector('[data-wall-action="approve"]').click();
  await waitFor(() => /Não consegui salvar/.test(textOf(offline.root.querySelector("[data-slot=message]"))));
});

test("lista que não carrega avisa (sem permissão ou conexão), vazio explica e o texto da plateia nunca vira HTML; stop solta a escuta", () => {
  assert.match(textOf(mount({ listenError: { code: "permission-denied" } }).root.querySelector("[data-slot=message]")), /Sem permissão/);
  assert.match(textOf(mount({ listenError: new Error("x") }).root.querySelector("[data-slot=message]")), /Não consegui ler os recados/);
  const empty = mount();
  assert.match(textOf(empty.root.querySelector("[data-slot=pending]")), /Nenhum recado aqui/);
  assert.equal(empty.root.querySelector("[data-slot=pending] .ad-empty img.ad-empty-mascot").getAttribute("src"), "assets/img/gumbleton.png", "estado vazio com o Gumbleton");
  const evil = mount({ initial: [post("a", "pending", 1, { text: "<img src=x onerror=alert(1)>", nickname: "<b>x</b>" })] });
  assert.equal(evil.root.querySelector(".ad-note img"), null, "nenhuma imagem injetada pelo texto da plateia");
  assert.equal(evil.root.querySelector("b"), null);
  assert.match(textOf(evil.root), /<img src=x onerror=alert\(1\)>/);
  const live = mount({ initial: [] });
  live.view.stop();
  assert.equal(live.listeners.length, 0);
});

test("cartão da visão geral: conta os recados pendentes (esperando em destaque, nenhum esperando em verde) e relê no ritmo do dado", async () => {
  const clock = createFakeClock();
  const definition = g("adminOverviewRepository").getAll().find(item => item.id === "wall");
  let pending = 3;
  const card = g("createAdminWallCard")({ definition, wallRepository: { countWhere: async filters => { assert.deepEqual({ ...filters }, { status: "pending" }); return pending; } }, timer: clock.schedule });
  const views = [];
  const stop = card(view => views.push({ ...view, lines: [...view.lines] }), () => {});
  await waitFor(() => views.length === 1);
  assert.deepEqual(views[0], { headline: "3 esperando", tone: "warn", lines: ["Abra Recados para aprovar"] });
  pending = 0;
  await clock.tick(definition.intervalMs + 10);
  await waitFor(() => views.length === 2);
  assert.deepEqual([views[1].headline, views[1].tone], ["Nenhum esperando", "ok"]);
  stop();
});
