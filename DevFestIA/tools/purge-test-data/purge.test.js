const test = require("node:test");
const assert = require("node:assert/strict");
const { planPurge, PURGEABLE_COLLECTIONS } = require("./purge-plan.js");
const { runPurge } = require("./purge-use-case.js");

const before = new Date("2026-11-27T12:00:00Z");
const after = new Date("2026-11-28T12:00:00Z");
const startsAt = new Date("2026-11-28T11:00:00Z");

test("lista fixa: só as 3 coleções de teste, nunca as do Sympla", () => {
  assert.deepEqual(PURGEABLE_COLLECTIONS, ["checkins", "talk-feedback", "event-feedback", "talk-questions", "talk-question-votes"]);
  ["registrations", "event-stats", "sync-state"].forEach(name => assert.equal(PURGEABLE_COLLECTIONS.includes(name), false));
});

test("plano: recusa depois do início do evento, mesmo com confirmação", () => {
  const plan = planPurge({ dryRun: false, confirm: "APAGAR", now: after, startsAt });
  assert.equal(plan.allowed, false);
  assert.match(plan.reason, /já começou/);
  assert.equal(planPurge({ dryRun: false, confirm: "APAGAR", now: startsAt, startsAt }).allowed, false, "no instante exato do início também recusa");
});

test("plano: apagar de verdade exige a palavra exata", () => {
  for (const confirm of ["", "apagar", "SIM", "APAGAR "]) {
    assert.equal(planPurge({ dryRun: false, confirm, now: before, startsAt }).allowed, false, `"${confirm}" não vale`);
  }
  assert.deepEqual(planPurge({ dryRun: false, confirm: "APAGAR", now: before, startsAt }), { allowed: true, deleting: true, reason: "" });
});

test("plano: simulação é o padrão e nunca apaga", () => {
  assert.deepEqual(planPurge({ now: before, startsAt }), { allowed: true, deleting: false, reason: "" });
  assert.equal(planPurge({ dryRun: true, confirm: "APAGAR", now: before, startsAt }).deleting, false);
});

function fakeDatabase(docsByCollection) {
  const commits = [];
  return { commits, listDocuments: async collection => docsByCollection[collection] ?? [], commit: async writes => commits.push(writes) };
}
const docs = {
  checkins: [{ id: "a", edition: "2026" }, { id: "b", edition: "2026" }, { id: "old", edition: "2025" }],
  "talk-feedback": [{ id: "c", edition: "2026" }],
  "event-feedback": [],
  "talk-questions": [{ id: "q1", edition: "2026" }],
  registrations: [{ id: "real1", edition: "2026" }],
  "event-stats": [{ id: "2026", edition: "2026" }],
};

test("caso de uso: simulação só conta e não grava nada", async () => {
  const database = fakeDatabase(docs);
  const report = await runPurge({ database, edition: "2026", deleting: false });
  assert.deepEqual(report, { checkins: { found: 2, deleted: 0 }, "talk-feedback": { found: 1, deleted: 0 }, "event-feedback": { found: 0, deleted: 0 }, "talk-questions": { found: 1, deleted: 0 }, "talk-question-votes": { found: 0, deleted: 0 } });
  assert.equal(database.commits.length, 0);
});

test("caso de uso: apaga só a edição atual, só nas coleções da lista, nunca as do Sympla", async () => {
  const database = fakeDatabase(docs);
  const report = await runPurge({ database, edition: "2026", deleting: true });
  assert.equal(report.checkins.deleted, 2);
  const removed = database.commits.flat().map(write => write.remove.join("/")).sort();
  assert.deepEqual(removed, ["checkins/a", "checkins/b", "talk-feedback/c", "talk-questions/q1"]);
  assert.ok(!removed.some(path => path.startsWith("registrations") || path.startsWith("event-stats") || path.includes("old")));
});
