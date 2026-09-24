/**
 * Testa a ordenação das perguntas ao vivo (docs/js/features/question-ranking.js,
 * função pura) e confere que a config de perguntas está desligada por padrão e
 * coerente com o limite de texto das regras do Firestore.
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

test("config: nasce desligada e o limite de texto bate com as regras do Firestore", () => {
  const read = file => fs.readFileSync(path.join(root, file), "utf8");
  const { enabled, maxLength } = vm.runInNewContext(`${read("docs/js/data/repository.js")}\n${read("docs/js/data/talk-questions.js")}\ntalkQuestionsConfigRepository.getAll()`);
  assert.strictEqual(enabled, false, "só ligar depois de publicar as regras");
  const rules = read("DevFestIA/firebase/firestore.rules");
  assert.ok(rules.includes(`requiredText(request.resource.data, 'text', ${maxLength + 1})`), "regra de texto diverge de maxLength");
});
