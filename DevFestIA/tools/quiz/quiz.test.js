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
const { scoreQuiz, pickSpread, talkScore, scoreTalks, rankTracks, pickAgenda } = require(path.join(docs, "js/features/quiz-scoring.js"));

const read = file => fs.readFileSync(path.join(docs, file), "utf8");
const { questions } = vm.runInNewContext(`${read("js/data/repository.js")}\n${read("js/data/quiz.js")}\nquizRepository.getAll()`);
const { topicIds, topicsBySpeaker } = vm.runInNewContext(`${read("js/data/repository.js")}\n${read("js/data/talk-topics.js")}\n({ topicIds: talkTopicsRepository.topicIds(), topicsBySpeaker: talkTopicsRepository.getAll() })`);
const idsOf = name => [...read("js/data/schedule.js").match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n\\];`))[1].matchAll(/\{ id: "(\w+)", label/g)].map(match => match[1]);
const trackIds = idsOf("TRACKS");

test("as trilhas do schedule.js foram encontradas", () => {
  assert.ok(trackIds.length >= 2, `trilhas: ${trackIds}`);
});

test("dado coerente: ids únicos, respostas suficientes e pesos só de assuntos existentes", () => {
  assert.strictEqual(new Set(questions.map(question => question.id)).size, questions.length);
  questions.forEach(question => {
    assert.ok(question.answers.length >= 2, `${question.id}: poucas respostas`);
    assert.strictEqual(new Set(question.answers.map(answer => answer.id)).size, question.answers.length, `${question.id}: resposta repetida`);
    question.answers.forEach(answer => {
      const ids = Object.keys(answer.weights);
      assert.ok(ids.length > 0, `${question.id}/${answer.id}: sem peso`);
      ids.forEach(id => assert.ok(topicIds.includes(id), `${question.id}/${answer.id}: assunto "${id}" não existe`));
    });
  });
});

test("todo assunto pode ser o mais pontuado em alguma combinação de respostas", () => {
  const winners = new Set();
  const walk = (index, choices) => {
    if (index === questions.length) {
      winners.add(scoreQuiz(questions, choices, topicIds).winnerId);
      return;
    }
    questions[index].answers.forEach(answer => walk(index + 1, { ...choices, [questions[index].id]: answer.id }));
  };
  walk(0, {});
  topicIds.forEach(id => assert.ok(winners.has(id), `assunto "${id}" nunca lidera`));
});

test("toda palestra real do schedule.js tem assuntos válidos, e o cadastro não tem palestrante que não existe", () => {
  const schedule = read("js/data/schedule.js");
  const speakerIds = new Set([...schedule.match(/const LINEUP_SPEAKER_ROWS = \[([\s\S]*?)\n\];/)[1].matchAll(/^\s+\["([\w-]+)", "/gm)].map(match => match[1]));
  const talksBlock = schedule.match(/const LINEUP_TALKS_BY_TRACK = \{([\s\S]*?)\n\};/)[1];
  const firstSpeakers = [...talksBlock.matchAll(/^\s{4}\[".*?", (?:\["([\w-]+)"|"([\w-]+)")/gm)].map(match => match[1] ?? match[2]);
  assert.ok(firstSpeakers.length >= 30, `palestras encontradas: ${firstSpeakers.length}`);
  firstSpeakers.forEach(id => {
    assert.ok(topicsBySpeaker[id]?.length >= 1 && topicsBySpeaker[id].length <= 3, `${id}: sem assuntos (1 a 3)`);
    topicsBySpeaker[id].forEach(topic => assert.ok(topicIds.includes(topic), `${id}: assunto "${topic}" não existe`));
  });
  Object.keys(topicsBySpeaker).forEach(id => {
    assert.ok(speakerIds.has(id), `${id}: palestrante não existe no schedule.js`);
    assert.ok(firstSpeakers.includes(id), `${id}: não é o 1º palestrante de nenhuma palestra`);
  });
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

const entry = (slotIndex, trackId, topics) => ({ slotIndex, track: { id: trackId }, data: { topics } });
const topicsOf = data => data.topics;

test("pontua cada palestra pelos assuntos dela e ignora quem não pontua (vaga sem assunto)", () => {
  assert.strictEqual(talkScore(["ia", "dados"], { ia: 3, dados: 1, mobile: 5 }), 4);
  const scored = scoreTalks([entry(0, "a", ["ia"]), entry(1, "a", []), entry(2, "b", ["ia", "dados"])], { ia: 3, dados: 1 }, topicsOf);
  assert.deepStrictEqual(scored.map(item => [item.entry.slotIndex, item.score]), [[2, 4], [0, 3]]);
});

test("empate de pontos: o horário mais cedo vem primeiro", () => {
  const scored = scoreTalks([entry(3, "a", ["ia"]), entry(1, "b", ["ia"])], { ia: 2 }, topicsOf);
  assert.deepStrictEqual(scored.map(item => item.entry.slotIndex), [1, 3]);
});

test("a trilha vencedora é a que reúne as melhores palestras (soma das `topPerTrack` melhores), com vice só se pontuou", () => {
  const scored = scoreTalks([entry(0, "a", ["ia"]), entry(1, "a", ["ia"]), entry(2, "a", ["ia"]), entry(3, "a", ["ia"]), entry(0, "b", ["ia", "dados"]), entry(1, "b", ["dados"])], { ia: 2, dados: 1 }, topicsOf);
  const ranked = rankTracks(scored, ["a", "b", "c"], 3);
  assert.deepStrictEqual(ranked.scores, { a: 6, b: 4, c: 0 });
  assert.strictEqual(ranked.winnerId, "a");
  assert.strictEqual(ranked.runnerUpId, "b");
  assert.strictEqual(rankTracks([], ["a", "b"], 3).runnerUpId, null);
});

test("a agenda tem no máximo uma palestra por horário, as melhores, em ordem de horário", () => {
  const scored = scoreTalks([entry(0, "a", ["ia"]), entry(0, "b", ["ia", "dados"]), entry(1, "a", ["dados"]), entry(2, "a", ["ia"]), entry(3, "b", ["dados"])], { ia: 3, dados: 2 }, topicsOf);
  const agenda = pickAgenda(scored, 3);
  assert.deepStrictEqual(agenda.map(item => [item.slotIndex, item.track.id]), [[0, "b"], [1, "a"], [2, "a"]]);
  assert.deepStrictEqual(pickAgenda([], 3), []);
});
