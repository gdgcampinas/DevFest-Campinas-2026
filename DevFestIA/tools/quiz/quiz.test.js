/**
 * Testa o quiz "Monte sua trilha" sem navegador: a pontuação (funções puras
 * de docs/js/features/quiz-scoring.js) e a coerência do dado
 * (docs/js/data/quiz.js contra as trilhas de schedule.js).
 *   node --test DevFestIA/tools/quiz/quiz.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const docs = path.join(__dirname, "..", "..", "..", "docs");
const { scoreQuiz, pickSpread } = require(path.join(docs, "js/features/quiz-scoring.js"));

const read = file => fs.readFileSync(path.join(docs, file), "utf8");
const { questions } = vm.runInNewContext(`${read("js/data/repository.js")}\n${read("js/data/quiz.js")}\nquizRepository.getAll()`);
const trackIds = [...read("js/data/schedule.js").match(/const TRACKS = \[([\s\S]*?)\n\];/)[1].matchAll(/\{ id: "(\w+)", label/g)].map(match => match[1]);

test("as trilhas do schedule.js foram encontradas", () => {
  assert.ok(trackIds.length >= 2, `trilhas: ${trackIds}`);
});

test("dado coerente: ids únicos, respostas suficientes e pesos só de trilhas existentes", () => {
  assert.strictEqual(new Set(questions.map(question => question.id)).size, questions.length);
  questions.forEach(question => {
    assert.ok(question.answers.length >= 2, `${question.id}: poucas respostas`);
    assert.strictEqual(new Set(question.answers.map(answer => answer.id)).size, question.answers.length, `${question.id}: resposta repetida`);
    question.answers.forEach(answer => {
      const ids = Object.keys(answer.weights);
      assert.ok(ids.length > 0, `${question.id}/${answer.id}: sem peso`);
      ids.forEach(id => assert.ok(trackIds.includes(id), `${question.id}/${answer.id}: trilha "${id}" não existe`));
    });
  });
});

test("toda trilha pode vencer em alguma combinação de respostas", () => {
  const winners = new Set();
  const walk = (index, choices) => {
    if (index === questions.length) {
      winners.add(scoreQuiz(questions, choices, trackIds).winnerId);
      return;
    }
    questions[index].answers.forEach(answer => walk(index + 1, { ...choices, [questions[index].id]: answer.id }));
  };
  walk(0, {});
  trackIds.forEach(id => assert.ok(winners.has(id), `trilha "${id}" nunca vence`));
});

test("soma os pesos e ordena o ranking", () => {
  const result = scoreQuiz(
    [{ id: "q", answers: [{ id: "a", weights: { ia: 3, mobile: 1 } }] }],
    { q: "a" },
    ["webdata", "ia", "mobile"]
  );
  assert.deepStrictEqual(result.scores, { webdata: 0, ia: 3, mobile: 1 });
  assert.deepStrictEqual(result.ranking, ["ia", "mobile", "webdata"]);
  assert.strictEqual(result.winnerId, "ia");
  assert.strictEqual(result.runnerUpId, "mobile");
});

test("empate vence quem vem primeiro na lista de trilhas, e sem segunda pontuada não há vice", () => {
  const tie = scoreQuiz([{ id: "q", answers: [{ id: "a", weights: { ia: 2, mobile: 2 } }] }], { q: "a" }, ["mobile", "ia"]);
  assert.strictEqual(tie.winnerId, "mobile");
  const single = scoreQuiz([{ id: "q", answers: [{ id: "a", weights: { ia: 2 } }] }], { q: "a" }, ["ia", "mobile"]);
  assert.strictEqual(single.runnerUpId, null);
});

test("pergunta sem resposta e peso de trilha desconhecida são ignorados", () => {
  const result = scoreQuiz([{ id: "q", answers: [{ id: "a", weights: { fantasma: 5, ia: 1 } }] }, { id: "r", answers: [{ id: "b", weights: { ia: 9 } }] }], { q: "a" }, ["ia"]);
  assert.deepStrictEqual(result.scores, { ia: 1 });
});

test("pickSpread espalha pela lista em vez de pegar os primeiros", () => {
  assert.deepStrictEqual(pickSpread([1, 2, 3, 4, 5, 6, 7, 8, 9], 3), [1, 5, 9]);
  assert.deepStrictEqual(pickSpread([1, 2], 3), [1, 2]);
  assert.deepStrictEqual(pickSpread([1, 2, 3], 1), [1]);
});
