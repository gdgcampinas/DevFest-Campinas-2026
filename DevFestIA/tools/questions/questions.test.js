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
const { questionWindowState } = require(path.join(root, "docs/js/features/question-window.js"));
const { planStatusChange } = require(path.join(root, "docs/js/features/question-status-plan.js"));
const { questionEntryKey, firstFreeQuestionSlot } = require(path.join(root, "docs/js/features/question-slots.js"));

const question = (id, createdAtMs, extra = {}) => ({ id, text: id, name: "x", createdAtMs, status: "approved", ...extra });
const vote = (uid, questionId) => ({ id: `${uid}_${questionId}`, entryKey: questionId });

test("ranking: só as aprovadas por padrão; mais votadas primeiro; empate pela mais antiga", () => {
  const ranked = rankQuestions(
    [question("a_t", 1), question("b_t", 2), question("c_t", 3), question("p_t", 0, { status: "pending" }), question("r_t", 0, { status: "rejected" })],
    [vote("u1", "c_t"), vote("u2", "c_t"), vote("u1", "b_t"), vote("u2", "b_t")]
  );
  assert.deepStrictEqual(ranked.map(item => item.id), ["b_t", "c_t", "a_t"]);
  assert.deepStrictEqual(ranked.map(item => item.votes), [2, 2, 0]);
});

test("ranking: voted e mine saem do id (uid), sem estado local", () => {
  const ranked = rankQuestions([question("me_t", 1), question("other_t", 2)], [vote("me", "other_t")], { myUid: "me" });
  const byId = Object.fromEntries(ranked.map(item => [item.id, item]));
  assert.strictEqual(byId.me_t.mine, true);
  assert.strictEqual(byId.other_t.mine, false);
  assert.strictEqual(byId.other_t.voted, true);
  assert.strictEqual(byId.me_t.voted, false);
});

test("ranking: uid que é prefixo de outro não confunde a autoria", () => {
  assert.strictEqual(rankQuestions([question("abc_t", 1)], [], { myUid: "ab" })[0].mine, false);
});

test("ranking: tela do moderador (todos os estados) agrupa por estado na ordem pedida; pendentes da mais antiga pra mais nova", () => {
  const questions = [
    question("ap1_t", 5), question("ap2_t", 6),
    question("pe_novo_t", 9, { status: "pending" }), question("pe_velho_t", 2, { status: "pending" }),
    question("ans_t", 1, { status: "answered" }), question("rej_t", 1, { status: "rejected" }),
  ];
  const ranked = rankQuestions(questions, [vote("u", "ap2_t")], { statuses: ["pending", "approved", "answered", "rejected"] });
  assert.deepStrictEqual(ranked.map(item => item.id), ["pe_velho_t", "pe_novo_t", "ap2_t", "ap1_t", "ans_t", "rej_t"]);
});

test("ranking: a plateia (approved + current) vê a da vez primeiro, mesmo com menos votos que as aprovadas", () => {
  const ranked = rankQuestions(
    [question("a_t", 1), question("b_t", 2), question("vez_t", 3, { status: "current" }), question("dev_t", 4, { status: "pending" })],
    [vote("u1", "a_t"), vote("u2", "a_t")],
    { statuses: ["current", "approved"] }
  );
  assert.deepStrictEqual(ranked.map(item => item.id), ["vez_t", "a_t", "b_t"]);
});

test("ranking: tela do moderador coloca a da vez entre a fila e as aprovadas", () => {
  const questions = [question("ap_t", 1), question("vez_t", 2, { status: "current" }), question("pe_t", 3, { status: "pending" })];
  const ranked = rankQuestions(questions, [], { statuses: ["pending", "current", "approved", "answered", "rejected"] });
  assert.deepStrictEqual(ranked.map(item => item.id), ["pe_t", "vez_t", "ap_t"]);
});

test("ranking: sem uid ninguém é dono nem votou", () => {
  const [item] = rankQuestions([question("a_t", 1)], [vote("u", "a_t")]);
  assert.strictEqual(item.mine, false);
  assert.strictEqual(item.voted, false);
  assert.strictEqual(item.votes, 1);
});

// ---------- janela de horário da palestra ----------
const slot = { start: new Date("2026-11-28T12:00:00Z"), end: new Date("2026-11-28T12:40:00Z") };
const at = iso => new Date(`2026-11-28T${iso}Z`);

test("janela: fechada antes, aberta do início ao fim (limites inclusos), fechada depois", () => {
  assert.strictEqual(questionWindowState(slot, at("11:59:59")), "before");
  assert.strictEqual(questionWindowState(slot, at("12:00:00")), "open");
  assert.strictEqual(questionWindowState(slot, at("12:20:00")), "open");
  assert.strictEqual(questionWindowState(slot, at("12:40:00")), "open");
  assert.strictEqual(questionWindowState(slot, at("12:40:01")), "closed");
});

test("janela: com a trava desligada (DEV) fica sempre aberta, em qualquer horário", () => {
  [at("07:00:00"), at("12:20:00"), at("23:59:00")].forEach(moment => assert.strictEqual(questionWindowState(slot, moment, { enforce: false }), "open"));
  assert.strictEqual(questionWindowState(slot, at("23:59:00"), { enforce: true }), "closed");
});

test("janela: as regras arredondam o início pro minuto, então a tela nunca abre antes do banco", () => {
  const withSeconds = { start: new Date("2026-11-28T12:00:30Z"), end: new Date("2026-11-28T12:40:30Z") };
  assert.strictEqual(questionWindowState(withSeconds, at("12:00:10")), "before");
});

// ---------- espaços de pergunta ----------
test("espaços: o primeiro livre de 1..N, nunca reaproveita um usado e devolve 0 quando acaba", () => {
  const talk = "2026-11-28T12:00:00.000Z|ia";
  assert.equal(firstFreeQuestionSlot([], talk, 10), 1);
  assert.equal(firstFreeQuestionSlot([questionEntryKey(talk, 1), questionEntryKey(talk, 3)], talk, 10), 2);
  assert.equal(firstFreeQuestionSlot([questionEntryKey(talk, 1), questionEntryKey(talk, 2)], talk, 2), 0);
  assert.equal(firstFreeQuestionSlot([questionEntryKey("outra|ia", 1)], talk, 3), 1, "espaço de outra palestra não conta");
});

const readFile = file => fs.readFileSync(path.join(root, file), "utf8");
const rules = readFile("DevFestIA/firebase/firestore.rules");
const config = () => vm.runInNewContext(`${readFile("docs/js/data/repository.js")}\n${readFile("docs/js/data/talk-questions.js")}\ntalkQuestionsConfigRepository.getAll()`);

test("config x regras: limite de texto e de perguntas por pessoa batem", () => {
  const { maxLength, maxPerPerson } = config();
  assert.ok(rules.includes(`requiredText(request.resource.data, 'text', ${maxLength + 1})`), "regra de texto diverge de maxLength");
  assert.ok(rules.includes(`int(parts[1]) <= ${maxPerPerson}`), "limite de espaços das regras diverge de maxPerPerson");
});

test("config x regras: a trava de horário está igual na tela (enforceWindow) e nas regras (windowEnforced)", () => {
  const rulesValue = rules.match(/function windowEnforced\(\) \{\s*return (true|false); \/\/ TRAVA-DE-HORARIO/)[1] === "true";
  assert.equal(config().enforceWindow, rulesValue, "ligue/desligue a trava nos dois lugares: data/talk-questions.js e firestore.rules");
});

test("config x regras: a duração da palestra nas regras é a da grade (schedule-builder.js)", () => {
  const rulesMinutes = Number(rules.match(/function talkDurationMinutes\(\) \{\s*return (\d+);/)[1]);
  const gridMinutes = Number(readFile("docs/js/data/schedule-builder.js").match(/talkMin = (\d+)/)[1]);
  assert.equal(rulesMinutes, gridMinutes, "palestra dura outro tempo na grade: atualize talkDurationMinutes() nas regras");
});

test("regras: todos os estados do site existem nas regras", () => {
  const { QUESTION_STATUS } = vm.runInNewContext(`${readFile("docs/js/data/repository.js")}\n${readFile("docs/js/data/talk-questions.js")}\n({ QUESTION_STATUS })`);
  Object.values(QUESTION_STATUS).forEach(status => assert.ok(rules.includes(`'${status}'`), `estado "${status}" não aparece nas regras`));
});

test("regras: os estados públicos da config são os que a regra de leitura libera", () => {
  const { PUBLIC_QUESTION_STATUSES } = vm.runInNewContext(`${readFile("docs/js/data/repository.js")}\n${readFile("docs/js/data/talk-questions.js")}\n({ PUBLIC_QUESTION_STATUSES })`);
  const readRule = rules.match(/resource\.data\.status in \[([^\]]+)\]/)[1].split(",").map(item => item.trim().replace(/'/g, ""));
  assert.deepEqual([...PUBLIC_QUESTION_STATUSES].sort(), readRule.sort());
});

test("regras: o id do documento tem que ser <uid>_<entryKey> nas perguntas e nos votos", () => {
  ["talk-questions", "talk-question-votes"].forEach(name => {
    const block = rules.slice(rules.indexOf(`match /${name}/`));
    assert.ok(block.slice(0, block.indexOf("allow update")).includes("idMatchesEntry(docId)"), `${name}: falta idMatchesEntry`);
  });
});

// ---------- plano de mudança de estado (só uma na vez por palestra) ----------
const doc = (id, status) => ({ id, status });

test("plano: pôr na vez rebaixa a que já estava na vez, antes de subir a nova", () => {
  const docs = [doc("a", "approved"), doc("b", "current"), doc("c", "approved")];
  assert.deepStrictEqual(planStatusChange(docs, "c", "current"), [{ id: "b", status: "approved" }, { id: "c", status: "current" }]);
});

test("plano: sem ninguém na vez, ou repondo a mesma, é uma atualização só", () => {
  assert.deepStrictEqual(planStatusChange([doc("a", "approved")], "a", "current"), [{ id: "a", status: "current" }]);
  assert.deepStrictEqual(planStatusChange([doc("a", "current")], "a", "current"), [{ id: "a", status: "current" }]);
});

test("plano: qualquer outra mudança (respondida, devolver, tirar do ar) não mexe na da vez", () => {
  const docs = [doc("a", "approved"), doc("b", "current")];
  ["answered", "pending", "rejected", "approved"].forEach(to => assert.deepStrictEqual(planStatusChange(docs, "a", to), [{ id: "a", status: to }]));
  assert.deepStrictEqual(planStatusChange(docs, "b", "pending"), [{ id: "b", status: "pending" }]);
});
