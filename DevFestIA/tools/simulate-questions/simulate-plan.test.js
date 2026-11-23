/**
 * Testa o plano da simulação de perguntas (DevFestIA/tools/simulate-questions/simulate-plan.js): palestra escolhida pela trilha e posição, formato dos documentos
 * (o mesmo que as regras do Firestore esperam), edição sempre a do DEV e ids fixos (repetir não duplica).
 *   node --test DevFestIA/tools/simulate-questions/simulate-plan.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { pickTalk, planSimulatedQuestions } = require("./simulate-plan.js");
const { SAMPLE_QUESTIONS } = require("./sample-questions.js");
const { readSiteSchedule } = require("../event-report/site-schedule.js");

const talks = new Map([
  ["2026-11-28T13:00:00.000Z|ia", { title: "Segunda de IA" }],
  ["2026-11-28T12:00:00.000Z|ia", { title: "Primeira de IA" }],
  ["2026-11-28T12:00:00.000Z|mobile", { title: "Primeira de Mobile" }],
]);

test("pickTalk: a palestra pela ordem do horário dentro da trilha; posição que não existe explica o erro", () => {
  assert.deepEqual(pickTalk({ talks, trackId: "ia" }), { key: "2026-11-28T12:00:00.000Z|ia", title: "Primeira de IA" });
  assert.equal(pickTalk({ talks, trackId: "ia", index: 2 }).title, "Segunda de IA");
  assert.equal(pickTalk({ talks, trackId: "mobile" }).title, "Primeira de Mobile");
  assert.throws(() => pickTalk({ talks, trackId: "ia", index: 3 }), /não tem a palestra número 3 \(tem 2\)/);
  assert.throws(() => pickTalk({ talks, trackId: "xyz" }), /não tem a palestra número 1 \(tem 0\)/);
});

test("planSimulatedQuestions: um documento por pergunta, no formato das regras, uma pessoa por pergunta, ids fixos", () => {
  const talkKey = "2026-11-28T12:00:00.000Z|ia";
  const writes = planSimulatedQuestions({ talkKey, edition: "2026-dev" });
  assert.equal(writes.length, SAMPLE_QUESTIONS.length);
  const [collection, id, data] = writes[0].set;
  assert.equal(collection, "talk-questions");
  assert.equal(id, `sim-1_${talkKey}#1`);
  assert.deepEqual(Object.keys(data).sort(), ["edition", "entryKey", "name", "status", "talkKey", "text", "uid"]);
  assert.equal(data.entryKey, `${talkKey}#1`);
  assert.ok(data.text.length <= 280 && data.name.length <= 80, "dentro dos limites das regras");
  assert.equal(new Set(writes.map(write => write.set[1])).size, writes.length, "ids distintos");
  assert.deepEqual(planSimulatedQuestions({ talkKey, edition: "2026-dev" }), writes, "repetir gera os mesmos ids");
  assert.deepEqual([...new Set(writes.map(write => write.set[2].status))].sort(), ["answered", "approved", "pending", "rejected"], "enche as quatro colunas");
});

test("planSimulatedQuestions: recusa a edição de produção", () => {
  assert.throws(() => planSimulatedQuestions({ talkKey: "k", edition: "2026" }), /só grava na edição do DEV/);
});

test("a primeira palestra da trilha IA da grade real existe (o padrão do workflow)", () => {
  const { key } = pickTalk({ talks: readSiteSchedule().talks, trackId: "ia" });
  assert.match(key, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|ia$/);
});
