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
const { buildBoardSnapshot } = require(path.join(root, "docs/js/features/board-snapshot.js"));
const { createBoardPublisher, approvedSignature } = require(path.join(root, "docs/js/features/board-publisher.js"));
const { questionWindowState } = require(path.join(root, "docs/js/features/question-window.js"));
const { questionEntryKey, firstFreeQuestionSlot } = require(path.join(root, "docs/js/features/question-slots.js"));

const question = (id, createdAtMs, extra = {}) => ({ id, text: id, name: "x", createdAtMs, status: "approved", ...extra });

test("ranking: só as aprovadas por padrão; mais votadas primeiro; empate pela mais antiga", () => {
  const ranked = rankQuestions(
    [question("a_t", 1), question("b_t", 2), question("c_t", 3), question("p_t", 0, { status: "pending" }), question("r_t", 0, { status: "rejected" })],
    { c_t: 2, b_t: 2 }
  );
  assert.deepStrictEqual(ranked.map(item => item.id), ["b_t", "c_t", "a_t"]);
  assert.deepStrictEqual(ranked.map(item => item.votes), [2, 2, 0]);
});

test("ranking: voted vem dos votos guardados neste navegador e mine sai do id (uid)", () => {
  const ranked = rankQuestions([question("me_t", 1), question("other_t", 2)], {}, { myUid: "me", votedIds: new Set(["other_t"]) });
  const byId = Object.fromEntries(ranked.map(item => [item.id, item]));
  assert.strictEqual(byId.me_t.mine, true);
  assert.strictEqual(byId.other_t.mine, false);
  assert.strictEqual(byId.other_t.voted, true);
  assert.strictEqual(byId.me_t.voted, false);
});

test("ranking: uid que é prefixo de outro não confunde a autoria", () => {
  assert.strictEqual(rankQuestions([question("abc_t", 1)], {}, { myUid: "ab" })[0].mine, false);
});

test("ranking: tela do moderador (todos os estados) agrupa por estado na ordem pedida; pendentes da mais antiga pra mais nova", () => {
  const questions = [
    question("ap1_t", 5), question("ap2_t", 6),
    question("pe_novo_t", 9, { status: "pending" }), question("pe_velho_t", 2, { status: "pending" }),
    question("ans_t", 1, { status: "answered" }), question("rej_t", 1, { status: "rejected" }),
  ];
  const ranked = rankQuestions(questions, { ap2_t: 1 }, { statuses: ["pending", "approved", "answered", "rejected"] });
  assert.deepStrictEqual(ranked.map(item => item.id), ["pe_velho_t", "pe_novo_t", "ap2_t", "ap1_t", "ans_t", "rej_t"]);
});

test("ranking: sem uid ninguém é dono nem votou", () => {
  const [item] = rankQuestions([question("a_t", 1)], { a_t: 1 });
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

test("regras: o id do documento tem que ser <uid>_<entryKey> nas perguntas e nos votos", () => {
  ["talk-questions", "talk-question-votes"].forEach(name => {
    const block = rules.slice(rules.indexOf(`match /${name}/`));
    assert.ok(block.slice(0, block.indexOf("allow update")).includes("idMatchesEntry(docId)"), `${name}: falta idMatchesEntry`);
  });
});

// ---------- quadro público da palestra ----------
test("quadro: só as aprovadas, na ordem dos votos, sem número de votos por padrão", () => {
  const questions = [question("a_t", 1), question("b_t", 2), question("p_t", 0, { status: "pending" })];
  assert.deepStrictEqual(buildBoardSnapshot(questions, { b_t: 3 }), { questions: [{ id: "b_t", text: "b_t", name: "x" }, { id: "a_t", text: "a_t", name: "x" }] });
  assert.deepStrictEqual(buildBoardSnapshot(questions, { b_t: 3 }, { includeVotes: true }).questions.map(item => item.votes), [3, 0]);
});

/** Repositories falsos que contam leituras (uma consulta de contagem = 1 leitura) e gravações. */
function fakeBoardWorld(counts) {
  const world = { reads: 0, writes: 0, counts };
  world.votes = { countWhere: async ({ entryKey }) => { world.reads++; return world.counts[entryKey] ?? 0; } };
  world.boards = { set: async () => { world.writes++; } };
  return world;
}

test("publicador: só regrava o quadro quando a ordem muda (votos que não mudam a ordem não custam nada pra plateia)", async () => {
  const world = fakeBoardWorld({ a_t: 1, b_t: 5 });
  const publisher = createBoardPublisher({ talkKey: "k", votes: world.votes, boards: world.boards });
  const questions = [question("a_t", 1), question("b_t", 2)];
  await publisher.publish(questions);
  assert.equal(world.writes, 1);
  world.counts = { a_t: 1, b_t: 9 }; // mais votos, mesma ordem
  await publisher.publish(questions);
  assert.equal(world.writes, 1);
  world.counts = { a_t: 10, b_t: 9 }; // a ordem virou
  await publisher.publish(questions);
  assert.equal(world.writes, 2);
  await publisher.publish([...questions, question("c_t", 3)]); // pergunta nova aprovada
  assert.equal(world.writes, 3);
});

test("publicador: com publishVotes ligado o quadro regrava a cada voto novo", async () => {
  const world = fakeBoardWorld({ a_t: 1 });
  const publisher = createBoardPublisher({ talkKey: "k", votes: world.votes, boards: world.boards, includeVotes: true });
  await publisher.publish([question("a_t", 1)]);
  world.counts = { a_t: 2 };
  await publisher.publish([question("a_t", 1)]);
  assert.equal(world.writes, 2);
});

test("publicador: assinatura das aprovadas muda ao aprovar, rejeitar ou reabrir", () => {
  const base = [question("a_t", 1), question("b_t", 2, { status: "pending" })];
  const before = approvedSignature(base);
  assert.notEqual(approvedSignature([base[0], { ...base[1], status: "approved" }]), before);
  assert.notEqual(approvedSignature([{ ...base[0], status: "rejected" }, base[1]]), before);
  assert.equal(approvedSignature([base[0], { ...base[1], text: "outro texto" }]), before);
});

test("orçamento de leituras: uma palestra cheia cabe no plano grátis (50 mil leituras por dia)", async () => {
  const cfg = config();
  const talksPerDay = 36;
  const phonesListening = 120; // celulares com o modal aberto durante a palestra, por sala (mais que o esperado)
  const talkMinutes = 40;
  const world = fakeBoardWorld({});
  const publisher = createBoardPublisher({ talkKey: "k", votes: world.votes, boards: world.boards, includeVotes: cfg.publishVotes });
  const questions = Array.from({ length: 12 }, (_, i) => question(`q${i}_t`, i));
  const askersShare = 0.1; // só quem já perguntou relê as próprias perguntas
  let listenerReads = phonesListening; // cada celular lê o quadro uma vez ao abrir
  for (let minute = 0; minute * 60000 < talkMinutes * 60000; minute += cfg.boardPublishMs / 60000) {
    // votos entrando: a cada ciclo, mais votos (um deles vira a ordem de vez em quando)
    questions.forEach((item, i) => { world.counts[item.id] = (world.counts[item.id] ?? 0) + (i === minute % 12 ? 3 : 1); });
    const before = world.writes;
    await publisher.publish(questions);
    listenerReads += (world.writes - before) * phonesListening; // 1 leitura por celular por regravação
  }
  const perTalk = world.reads + listenerReads + Math.round(phonesListening * askersShare) * 3; // + as próprias perguntas de quem perguntou (até 3)
  const perDay = perTalk * talksPerDay;
  assert.ok(perDay < 50000, `estimativa de ${perDay} leituras/dia passa do limite grátis (50000): ${JSON.stringify({ moderatorCounts: world.reads, boardWrites: world.writes, listenerReads })}`);
});
