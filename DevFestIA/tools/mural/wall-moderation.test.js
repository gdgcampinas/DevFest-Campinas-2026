/**
 * Regras puras da moderação dos recados (docs/js/features/wall-moderation.js): agrupar por estado, ordem de atendimento e o estado que cada botão grava.
 *   node --test DevFestIA/tools/mural/wall-moderation.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { groupWallPosts, wallStatusFor } = load("features/wall-moderation.js");

const post = (id, status, createdAtMs) => ({ id, status, createdAtMs });

test("agrupar: pendentes do mais antigo pro mais novo, aprovados e os outros do mais novo pro mais antigo, cada recado em um grupo só", () => {
  const groups = groupWallPosts([post("a", "pending", 30), post("b", "approved", 10), post("c", "pending", 5), post("d", "approved", 20), post("e", "hidden", 1), post("f", "rejected", 2), post("g", "pending")]);
  assert.deepEqual(groups.pending.map(item => item.id), ["g", "c", "a"], "sem hora conta como o mais antigo");
  assert.deepEqual(groups.approved.map(item => item.id), ["d", "b"]);
  assert.deepEqual(groups.other.map(item => item.id), ["f", "e"]);
  assert.deepEqual(groupWallPosts([]), { pending: [], approved: [], other: [] });
});

test("botão -> estado: aprovar e devolver gravam approved, recusar rejected, tirar do ar hidden; ação desconhecida lança", () => {
  assert.deepEqual(["approve", "restore", "reject", "hide"].map(wallStatusFor), ["approved", "approved", "rejected", "hidden"]);
  assert.throws(() => wallStatusFor("delete"), /ação desconhecida/);
  assert.throws(() => wallStatusFor("pending"), /ação desconhecida/);
});
