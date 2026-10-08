/**
 * Testes de TELA da seção "Antes do evento" do admin (docs/js/features/admin-before-event.js, components/admin-before-event.js), da confirmação em dois toques (features/two-tap-confirm.js)
 * e da limpeza deste aparelho (features/local-reset.js `resetBrowserData`): o texto da limpeza do banco com o link do GitHub, o botão do aparelho que só age no 2º toque, o resultado e o desligamento.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-before-event.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/admin-sections.js", "features/two-tap-confirm.js", "features/local-reset.js", "components/local-reset.js", "components/admin-before-event.js", "features/admin-before-event.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const config = g("adminBeforeEventRepository").getAll();

test("dois toques: o 1º arma a chave, o 2º na mesma chave executa; outra chave troca a armada; passado o prazo desarma sozinho", async () => {
  const clock = createFakeClock();
  const changes = [];
  const ran = [];
  const confirm = g("createTwoTapConfirm")({ schedule: clock.schedule, confirmMs: 5000, onChange: key => changes.push(key) });
  assert.equal(confirm.press("a", () => ran.push("a")), undefined);
  assert.equal(confirm.armed(), "a");
  confirm.press("b", () => ran.push("b"));
  assert.equal(confirm.armed(), "b", "outra chave troca a armada");
  assert.equal(ran.length, 0);
  confirm.press("b", () => ran.push("b"));
  assert.deepEqual([...ran], ["b"]);
  assert.equal(confirm.armed(), null);
  confirm.press("a", () => ran.push("a"));
  await clock.tick(5001);
  assert.equal(confirm.armed(), null, "venceu o prazo");
  confirm.press("a", () => ran.push("a"));
  assert.equal(ran.length, 1, "depois de vencer o 1º toque não conta");
  assert.deepEqual([...changes], ["a", "b", null, "a", null, "a"]);
  confirm.disarm();
  assert.equal(clock.pending(), 0);
});

test("dois toques: devolve o que a ação devolve no 2º toque", () => {
  const confirm = g("createTwoTapConfirm")({ schedule: createFakeClock().schedule });
  confirm.press("x", () => 1);
  assert.equal(confirm.press("x", () => 42), 42);
});

function mount({ reset } = {}) {
  document.body.innerHTML = `<div id="view"></div>`;
  const clock = createFakeClock();
  const calls = [];
  const view = g("initAdminBeforeEvent")(document.getElementById("view"), {
    config, schedule: clock.schedule, resultRows: g("localResetRows"),
    reset: reset ?? (async () => { calls.push("reset"); return { local: 3, session: 1, databases: 2, caches: 1, workers: 1 }; }),
  });
  return { view, clock, calls, root: document.getElementById("view") };
}

test("limpeza do banco: explica o que apaga, o que nunca toca, os passos e a trava, e o botão é um link pro workflow do GitHub em aba nova", () => {
  const { root } = mount();
  const card = root.querySelector('[data-card="purge"]');
  assert.match(textOf(card), /Limpar o banco \(dados de teste\)/);
  assert.match(textOf(card), /Check-ins, avaliações das palestras e do evento/);
  assert.match(textOf(card), /Nunca toca nos inscritos do Sympla/);
  assert.match(textOf(card), /digite APAGAR/);
  assert.match(textOf(card), /depois que o evento começa/);
  const link = card.querySelector("a");
  assert.equal(link.getAttribute("href"), "https://github.com/gdgcampinas/DevFest-Campinas-2026/actions/workflows/purge-test-data.yml");
  assert.equal(link.target, "_blank");
  assert.equal(link.rel, "noopener");
});

test("limpar este aparelho: o 1º toque só pede confirmação, o 2º limpa e mostra o resultado; o botão some depois", async () => {
  const { root, calls } = mount();
  const button = () => root.querySelector("[data-device-reset]");
  assert.match(textOf(button()), /Limpar este aparelho/);
  button().click();
  assert.match(textOf(button()), /Toque de novo para CONFIRMAR/);
  assert.equal(calls.length, 0);
  button().click();
  await waitFor(() => !button());
  assert.deepEqual([...calls], ["reset"]);
  assert.match(textOf(root.querySelector('[data-slot="device"]')), /Este aparelho está limpo/);
  assert.match(textOf(root.querySelector('[data-slot="device"]')), /Check-ins, avaliações, nome e favoritos: 4/);
  assert.match(textOf(root.querySelector('[data-slot="device"]')), /Usuário anônimo do Firebase: 2/);
});

test("limpar este aparelho: sem o 2º toque a confirmação vence e nada é limpo; stop desliga o relógio", async () => {
  const { root, calls, clock, view } = mount();
  root.querySelector("[data-device-reset]").click();
  await clock.tick(config.confirmMs + 1);
  assert.match(textOf(root.querySelector("[data-device-reset]")), /Limpar este aparelho/);
  assert.equal(calls.length, 0);
  root.querySelector("[data-device-reset]").click();
  view.stop();
  assert.equal(clock.pending(), 0);
});

test("limpar este aparelho: dois cliques seguidos enquanto limpa não limpam duas vezes", async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let runs = 0;
  const { root } = mount({ reset: async () => { runs++; await gate; return { local: 0, session: 0, databases: 0, caches: 0, workers: 0 }; } });
  root.querySelector("[data-device-reset]").click();
  root.querySelector("[data-device-reset]").click();
  assert.ok(root.querySelector("[data-device-reset]").disabled);
  root.querySelector("[data-device-reset]").click();
  release();
  await waitFor(() => !root.querySelector("[data-device-reset]"));
  assert.equal(runs, 1);
});

test("resetBrowserData usa as APIs da janela injetada com o prefixo do site e conta o que removeu", async () => {
  const removed = [];
  const store = { "devfest-campinas-2026:a": "1", "devfest-campinas-2026:b": "2", "outro:c": "3" };
  const storage = Object.assign(Object.create({ removeItem: key => { removed.push(key); delete store[key]; } }), store);
  const win = { localStorage: storage, sessionStorage: Object.assign(Object.create({ removeItem() {} }), {}), indexedDB: undefined, caches: { keys: async () => ["c1", "c2"], delete: async () => true } };
  const result = await g("resetBrowserData")(win, { serviceWorker: { getRegistrations: async () => [{ unregister: async () => true }] } });
  assert.deepEqual([...removed].sort(), ["devfest-campinas-2026:a", "devfest-campinas-2026:b"]);
  assert.deepEqual({ ...result }, { local: 2, session: 0, databases: 0, caches: 2, workers: 1 });
});
