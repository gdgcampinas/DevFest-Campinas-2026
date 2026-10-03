/**
 * Testes das rodadas do sorteio (docs/js/features/raffle-rounds.js): id do sorteio por rodada e filtro da rodada atual.
 *   node --test DevFestIA/tools/raffle/raffle-rounds.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { raffleDrawDocId, drawsOfRound, RAFFLE_FIRST_ROUND, RAFFLE_STATE_ID } = require("../../../docs/js/features/raffle-rounds.js");

test("id do sorteio: a rodada 1 mantém o id de sempre; as seguintes levam a rodada", () => {
  assert.equal(raffleDrawDocId("2026_abc", 1), "2026_abc_draw");
  assert.equal(raffleDrawDocId("2026_abc", 2), "2026_abc_r2_draw");
  assert.equal(raffleDrawDocId("2026_abc", 13), "2026_abc_r13_draw");
  assert.notEqual(raffleDrawDocId("x", 2), raffleDrawDocId("x", 3));
});

test("rodada atual: só entram os sorteios dela; sorteio antigo, sem round, é da rodada 1", () => {
  const draws = [{ id: "a" }, { id: "b", round: 1 }, { id: "c", round: 2 }, { id: "d", round: 2 }, { id: "e", round: 3 }];
  assert.deepEqual(drawsOfRound(draws, 1).map(d => d.id), ["a", "b"]);
  assert.deepEqual(drawsOfRound(draws, 2).map(d => d.id), ["c", "d"]);
  assert.deepEqual(drawsOfRound(draws, 4), []);
});

test("constantes: a primeira rodada é 1 e o documento de estado é 'current'", () => {
  assert.equal(RAFFLE_FIRST_ROUND, 1);
  assert.equal(RAFFLE_STATE_ID, "current");
});
