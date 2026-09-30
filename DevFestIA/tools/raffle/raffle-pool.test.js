/**
 * Testes das regras puras da roleta (docs/js/features/raffle-pool.js): nome da fatia, chegadas, amostra da roda
 * e montagem do giro. Sem DOM, sem Firebase.   node --test DevFestIA/tools/raffle/raffle-pool.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { RAFFLE_WHEEL_MAX_SLICES, raffleDisplayName, recentArrivals, idleWheelEntries, pickRaffleWinner, buildSpinWheel } = require("../../../docs/js/features/raffle-pool.js");

const person = (n, createdAtMs = n) => ({ id: `u${n}_raffle`, firstName: `P${n}`, lastName: `S${n}`, createdAtMs });
const crowd = size => Array.from({ length: size }, (_, i) => person(i + 1));

test("nome da fatia: nome + último sobrenome", () => {
  assert.equal(raffleDisplayName({ firstName: "Henrique", lastName: "Ferreira Rodrigues da Silva" }), "Henrique Silva");
  assert.equal(raffleDisplayName({ firstName: "Ana", lastName: "Souza" }), "Ana Souza");
  assert.equal(raffleDisplayName({ firstName: "Ana", lastName: "" }), "Ana");
});

test("chegadas: o mais recente primeiro, limitado, e quem ainda não tem horário (acabou de chegar) conta como o mais novo", () => {
  const entries = [person(1, 100), person(2, 300), person(3, 0), person(4, 200)];
  assert.deepEqual(recentArrivals(entries, 10).map(e => e.id), ["u3_raffle", "u2_raffle", "u4_raffle", "u1_raffle"]);
  assert.equal(recentArrivals(entries, 2).length, 2);
});

test("roda parada: até o máximo mostra todo mundo na ordem de chegada", () => {
  const entries = [person(3, 300), person(1, 100), person(2, 200)];
  assert.deepEqual(idleWheelEntries(entries, 24).map(e => e.id), ["u1_raffle", "u2_raffle", "u3_raffle"]);
});

test("roda parada: acima do máximo mostra só os mais recentes (continua enchendo)", () => {
  const shown = idleWheelEntries(crowd(1000));
  assert.equal(shown.length, RAFFLE_WHEEL_MAX_SLICES);
  assert.equal(shown.at(-1).id, "u1000_raffle");
  assert.equal(shown[0].id, `u${1000 - RAFFLE_WHEEL_MAX_SLICES + 1}_raffle`);
});

test("sorteio: sai da lista INTEIRA, não da amostra da roda", () => {
  const pool = crowd(1000);
  assert.equal(pickRaffleWinner(pool, () => 0).id, "u1_raffle");
  assert.equal(pickRaffleWinner(pool, () => 0.9999).id, "u1000_raffle");
  assert.equal(pickRaffleWinner(pool, () => 0.5).id, "u501_raffle");
});

test("giro com lista pequena: a roda é a lista inteira e aponta pro sorteado", () => {
  const pool = crowd(10);
  const { entries, winnerIndex } = buildSpinWheel(pool, pool[6], 24);
  assert.equal(entries.length, 10);
  assert.equal(entries[winnerIndex].id, pool[6].id);
});

test("giro com 1.000 pessoas: só o máximo de fatias, o sorteado sempre dentro, sem repetidos", () => {
  const pool = crowd(1000);
  for (let round = 0; round < 200; round++) {
    const winner = pool[Math.floor(Math.random() * pool.length)];
    const { entries, winnerIndex } = buildSpinWheel(pool, winner);
    assert.equal(entries.length, RAFFLE_WHEEL_MAX_SLICES);
    assert.equal(entries[winnerIndex].id, winner.id);
    assert.equal(new Set(entries.map(e => e.id)).size, RAFFLE_WHEEL_MAX_SLICES);
    assert.ok(entries.every(e => pool.some(p => p.id === e.id)));
  }
});

test("giro com 1.000 pessoas: o sorteado cai em fatias variadas, não sempre na mesma", () => {
  const pool = crowd(1000);
  const positions = new Set();
  for (let round = 0; round < 300; round++) positions.add(buildSpinWheel(pool, pool[0]).winnerIndex);
  assert.ok(positions.size > 10, `só ${positions.size} posições diferentes`);
});

test("giro: não altera a lista original", () => {
  const pool = crowd(100);
  const before = pool.map(e => e.id).join();
  buildSpinWheel(pool, pool[5]);
  assert.equal(pool.map(e => e.id).join(), before);
});
