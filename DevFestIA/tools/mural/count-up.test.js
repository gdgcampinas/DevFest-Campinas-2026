/**
 * Número que sobe (docs/js/features/count-up.js): a conta pura e o andamento no relógio injetado.
 *   node --test DevFestIA/tools/mural/count-up.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createFakeClock } = require("../lib/fake-clock.js");
const { scheduleEvery, defaultSchedule } = load("features/scheduler.js");
globalThis.scheduleEvery = scheduleEvery;
const { countUpValue, runCountUp } = load("features/count-up.js");

test("a conta: começa em 0, termina no total, desacelera no fim e não passa dos limites", () => {
  assert.equal(countUpValue(200, 0), 0);
  assert.equal(countUpValue(200, 1), 200);
  assert.equal(countUpValue(200, 2), 200, "progresso acima de 1 vale 1");
  assert.equal(countUpValue(200, -1), 0);
  assert.ok(countUpValue(200, 0.5) > 100, "sobe rápido no começo (curva que desacelera)");
  assert.ok(countUpValue(200, 0.3) < 200);
});

test("anda passo a passo, chega no total e PÁRA sozinho (sem timer sobrando)", async () => {
  const clock = createFakeClock();
  const values = [];
  runCountUp({ schedule: clock.schedule, total: 120, durationMs: 400, stepMs: 100, onValue: value => values.push(value) });
  await clock.tick(1000);
  assert.equal(values[0], 0);
  assert.equal(values.at(-1), 120);
  assert.deepEqual(values, [...values].sort((a, b) => a - b), "nunca desce");
  assert.equal(values.length, 5, "0, 100, 200, 300 e 400 ms");
  assert.equal(clock.pending(), 0);
});

test("a função devolvida pára no meio e duração zero termina na hora", async () => {
  const clock = createFakeClock();
  const values = [];
  const stop = runCountUp({ schedule: clock.schedule, total: 50, durationMs: 1000, stepMs: 100, onValue: value => values.push(value) });
  await clock.tick(250);
  stop();
  const seen = values.length;
  await clock.tick(5000);
  assert.equal(values.length, seen);
  assert.equal(clock.pending(), 0);

  const instant = [];
  runCountUp({ schedule: clock.schedule, total: 7, durationMs: 0, stepMs: 100, onValue: value => instant.push(value) });
  await clock.tick(500);
  assert.deepEqual(instant, [7]);
  assert.equal(typeof defaultSchedule, "function");
});
