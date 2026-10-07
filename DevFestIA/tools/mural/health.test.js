/**
 * Saúde do mural (docs/js/features/mural-health.js): quando recarregar, trava anti-laço, ledger, vigia e relógio independente.
 *   node --test DevFestIA/tools/mural/health.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { evaluateHealth, createReloadLedger, createIndependentTicker, createWatchdog } = load("features/mural-health.js");
const { memoryStorage } = require("../lib/dom-harness.js");

const config = { maxConsecutiveFailures: 6, preventiveReloadMs: 2 * 3600000, reloadStormWindowMs: 600000, reloadStormMax: 3 };
const base = { now: 1000, startedAt: 0, beatDueAt: 5000, failures: 0, pending: [], recentReloads: [] };
const decide = extra => evaluateHealth({ ...base, ...extra }, config);

test("tudo bem: não faz nada", () => {
  assert.deepEqual(decide({}), { action: "none", reason: null, degraded: false });
});

test("rodízio travado (passou do prazo da próxima troca): recarrega na hora, mesmo fora da troca", () => {
  assert.equal(decide({ now: 6000 }).reason, "stuck");
  assert.equal(decide({ now: 6000 }).action, "reload");
});

test("cenas falhando em sequência: recarrega", () => {
  assert.equal(decide({ failures: 5 }).action, "none");
  assert.equal(decide({ failures: 6 }).reason, "scene-failures");
});

test("recarga preventiva e motivos pendentes (versão, volta da internet) só valem NA TROCA de cena", () => {
  const old = { now: 2 * 3600000 + 1, startedAt: 0, beatDueAt: Infinity };
  assert.equal(decide({ ...old, atBoundary: false }).action, "none");
  assert.equal(decide({ ...old, atBoundary: true }).reason, "preventive");
  assert.equal(decide({ atBoundary: false, pending: ["version"] }).action, "none");
  assert.equal(decide({ atBoundary: true, pending: ["version"] }).reason, "version");
  assert.equal(decide({ atBoundary: true, pending: ["offline-recovery"] }).reason, "offline-recovery");
});

test("trava anti-laço: recargas demais em pouco tempo não recarregam de novo, marcam degradado", () => {
  const verdict = decide({ now: 6000, recentReloads: [100, 200, 300] });
  assert.deepEqual(verdict, { action: "none", reason: "reload-storm", degraded: true });
  const old = decide({ now: 6000, recentReloads: [-900000, -800000, -700000] });
  assert.equal(old.action, "reload", "recargas antigas (fora da janela) não contam");
});

test("ledger guarda recargas e cena; sobrevive a storage que falha", () => {
  const storage = memoryStorage();
  const ledger = createReloadLedger({ storage });
  ledger.saveScene("fotos");
  ledger.recordReload("stuck", 123);
  const again = createReloadLedger({ storage });
  assert.equal(again.lastSceneId(), "fotos");
  assert.deepEqual(again.recentReloads(), [123]);
  assert.equal(again.lastReason(), "stuck");

  const broken = createReloadLedger({ storage: { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } } });
  broken.saveScene("x");
  broken.recordReload("stuck", 5);
  assert.deepEqual(broken.recentReloads(), [5], "em memória, sem estourar");
});

test("ledger guarda só as últimas 20 recargas", () => {
  const ledger = createReloadLedger({ storage: memoryStorage() });
  for (let i = 0; i < 30; i++) ledger.recordReload("stuck", i);
  assert.equal(ledger.recentReloads().length, 20);
  assert.equal(ledger.recentReloads().at(-1), 29);
});

test("vigia: recarrega uma vez só e registra no ledger", () => {
  const reloads = [];
  const ledger = createReloadLedger({ storage: memoryStorage() });
  let time = 6000;
  const watchdog = createWatchdog({ ticker: { start() {}, stop() {} }, snapshot: () => ({ startedAt: 0, beatDueAt: 5000, failures: 0, pending: [] }), config, ledger, reload: reason => reloads.push(reason), nowMs: () => time });
  assert.equal(watchdog.check().action, "reload");
  assert.equal(watchdog.check().action, "none", "já está recarregando");
  assert.deepEqual(reloads, ["stuck"]);
  assert.deepEqual(ledger.recentReloads(), [6000]);
});

test("vigia: depois de 3 recargas seguidas pára de recarregar e avisa degradado", () => {
  const decisions = [];
  const ledger = createReloadLedger({ storage: memoryStorage() });
  [100, 200, 300].forEach(time => ledger.recordReload("stuck", time));
  const watchdog = createWatchdog({ ticker: { start() {}, stop() {} }, snapshot: () => ({ startedAt: 0, beatDueAt: 5000, failures: 0, pending: [] }), config, ledger, reload: () => assert.fail("não deveria recarregar"), nowMs: () => 6000, onDecision: d => decisions.push(d) });
  watchdog.check();
  assert.equal(decisions[0].degraded, true);
});

test("relógio independente: usa o Worker; se o Worker não existe ou dá erro, cai no setInterval", () => {
  const ticks = [];
  const sent = [];
  let worker;
  const win = { setInterval: () => 7, clearInterval() {} };
  const ticker = createIndependentTicker({ intervalMs: 5000, win, createWorker: () => (worker = { postMessage: m => sent.push(m), terminate() {} }) });
  ticker.start(() => ticks.push(1));
  worker.onmessage();
  assert.equal(ticks.length, 1);
  assert.deepEqual(sent, [5000]);
  ticker.stop();
  assert.deepEqual(sent, [5000, 0]);

  let fallbackInterval = null;
  const noWorker = createIndependentTicker({ intervalMs: 5000, win: { setInterval: (fn, ms) => { fallbackInterval = { fn, ms }; return 1; }, clearInterval() {} }, createWorker: () => { throw new Error("sem Worker"); } });
  noWorker.start(() => ticks.push(2));
  assert.equal(fallbackInterval.ms, 5000);
  fallbackInterval.fn();
  assert.deepEqual(ticks, [1, 2]);
});
