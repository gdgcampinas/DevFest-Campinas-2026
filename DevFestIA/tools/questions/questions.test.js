/**
 * Testa a ordenação das perguntas ao vivo (docs/js/features/question-ranking.js,
 * função pura) e confere que a config de perguntas bate com as regras do Firestore.
 *   node --test DevFestIA/tools/questions/questions.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..", "..", "..");
const { rankQuestions } = require(path.join(root, "docs/js/features/question-ranking.js"));

const question = (id, createdAtMs, extra = {}) => ({ id, text: id, name: "x", createdAtMs, hidden: false, ...extra });
const vote = (uid, questionId) => ({ id: `${uid}_${questionId}`, entryKey: questionId });

test("mais votadas primeiro; empate pela mais antiga", () => {
  const ranked = rankQuestions(
    [question("a_t", 1), question("b_t", 2), question("c_t", 3)],
    [vote("u1", "c_t"), vote("u2", "c_t"), vote("u1", "b_t"), vote("u2", "b_t")]
  );
  assert.deepStrictEqual(ranked.map(item => item.id), ["b_t", "c_t", "a_t"]);
  assert.deepStrictEqual(ranked.map(item => item.votes), [2, 2, 0]);
});

test("voted e mine saem do id (uid), sem estado local", () => {
  const ranked = rankQuestions([question("me_t", 1), question("other_t", 2)], [vote("me", "other_t")], { myUid: "me" });
  const byId = Object.fromEntries(ranked.map(item => [item.id, item]));
  assert.strictEqual(byId.me_t.mine, true);
  assert.strictEqual(byId.other_t.mine, false);
  assert.strictEqual(byId.other_t.voted, true);
  assert.strictEqual(byId.me_t.voted, false);
});

test("uid que é prefixo de outro não confunde a autoria", () => {
  const ranked = rankQuestions([question("abc_t", 1)], [], { myUid: "ab" });
  assert.strictEqual(ranked[0].mine, false);
});

test("ocultas somem; com includeHidden vão por último", () => {
  const questions = [question("a_t", 1, { hidden: true }), question("b_t", 2)];
  assert.deepStrictEqual(rankQuestions(questions, []).map(item => item.id), ["b_t"]);
  assert.deepStrictEqual(rankQuestions(questions, [vote("u", "a_t")], { includeHidden: true }).map(item => item.id), ["b_t", "a_t"]);
});

test("sem uid ninguém é dono nem votou (tela do moderador)", () => {
  const [item] = rankQuestions([question("a_t", 1)], [vote("u", "a_t")]);
  assert.strictEqual(item.mine, false);
  assert.strictEqual(item.voted, false);
  assert.strictEqual(item.votes, 1);
});

const readFile = file => fs.readFileSync(path.join(root, file), "utf8");
const rules = readFile("DevFestIA/firebase/firestore.rules");
const config = () => vm.runInNewContext(`${readFile("docs/js/data/repository.js")}\n${readFile("docs/js/data/talk-questions.js")}\ntalkQuestionsConfigRepository.getAll()`);

test("config x regras: limite de texto e de perguntas por pessoa batem", () => {
  const { maxLength, maxPerPerson } = config();
  assert.ok(rules.includes(`requiredText(request.resource.data, 'text', ${maxLength + 1})`), "regra de texto diverge de maxLength");
  assert.ok(rules.includes(`int(parts[1]) <= ${maxPerPerson}`), "limite de espaços das regras diverge de maxPerPerson");
});

test("config x regras: a duração da palestra nas regras é a da grade (schedule-builder.js)", () => {
  const rulesMinutes = Number(rules.match(/function talkDurationMinutes\(\) \{\s*return (\d+);/)[1]);
  const gridMinutes = Number(readFile("docs/js/data/schedule-builder.js").match(/talkMin = (\d+)/)[1]);
  assert.equal(rulesMinutes, gridMinutes, "palestra dura outro tempo na grade: atualize talkDurationMinutes() nas regras");
});

test("regras: o id do documento tem que ser <uid>_<entryKey> nas perguntas e nos votos", () => {
  ["talk-questions", "talk-question-votes"].forEach(name => {
    const block = rules.slice(rules.indexOf(`match /${name}/`));
    assert.ok(block.slice(0, block.indexOf("allow update")).includes("idMatchesEntry(docId)"), `${name}: falta idMatchesEntry`);
  });
});
