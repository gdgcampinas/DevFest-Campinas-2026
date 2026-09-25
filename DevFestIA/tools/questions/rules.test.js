/**
 * Testa as REGRAS do Firestore das perguntas ao vivo contra o emulador (nada toca o banco real):
 * janela de horário da palestra, check-in, até 10 perguntas por pessoa, fila de aprovação do moderador
 * e votos. As palestras de teste têm horário RELATIVO A AGORA (início daqui a N minutos), então nada
 * depende de ser o dia do evento. A trava de horário é um interruptor nas regras (`windowEnforced()`): o script roda
 * os testes duas vezes, com a trava ligada (RULES_WINDOW=on, cópia temporária das regras) e como está no arquivo
 * (RULES_WINDOW=off quando desligada). Rodar:  DevFestIA/tools/questions/run-rules-tests.sh
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { anonymous, google, createDoc, updateDoc, query, seed } = require("../lib/firestore-emulator.js");

const skip = process.env.FIRESTORE_EMULATOR_HOST ? false : "rode com DevFestIA/tools/questions/run-rules-tests.sh (precisa do emulador)";
const windowOn = process.env.RULES_WINDOW === "on";
const onlyWithWindow = skip || (windowOn ? false : "só vale com a trava de horário ligada");
const onlyWithoutWindow = skip || (windowOn ? "só vale com a trava de horário desligada" : false);
const rules = fs.readFileSync(path.join(__dirname, "..", "..", "firebase", "firestore.rules"), "utf8");
const moderatorEmail = rules.match(/request\.auth\.token\.email in \['([^']+)'/)[1];

// ---------- cenário ----------
let counter = 0;
const nextId = prefix => `${prefix}${Date.now().toString(36)}${counter++}`;
const person = () => anonymous(nextId("u"));
const moderator = () => google(nextId("m"), moderatorEmail);

/** Trilha única por chamada (só letras, como o formato da chave exige): cada teste tem a sua palestra, sem dados de outro teste. */
const uniqueTrack = () => `t${Date.now().toString(36)}${counter++}`.replace(/[0-9]/g, digit => "abcdefghij"[digit]);

/** Chave de palestra que COMEÇOU há `startedMinAgo` minutos (negativo = começa daqui a N). Duração de 40 min, como na grade. */
function talkKeyStarted(startedMinAgo, track = uniqueTrack()) {
  const start = new Date(Date.now() - startedMinAgo * 60000);
  start.setUTCSeconds(0, 0);
  return `${start.toISOString()}|${track}`;
}
const LIVE = () => talkKeyStarted(10);
const NOT_STARTED = () => talkKeyStarted(-30);
const ENDED = () => talkKeyStarted(60);

const base = { edition: "2026" };
const checkin = (who, talkKey) => createDoc(who, "checkins", `${who.uid}_${talkKey}`, { ...base, entryKey: talkKey });
const questionData = (who, talkKey, slot = 1, extra = {}) => ({ ...base, entryKey: `${talkKey}#${slot}`, talkKey, uid: who.uid, text: "Uma pergunta?", name: "Ana", status: "pending", ...extra });
const ask = (who, talkKey, slot = 1, extra = {}) => createDoc(who, "talk-questions", `${who.uid}_${talkKey}#${slot}`, questionData(who, talkKey, slot, extra));
const vote = (who, talkKey, questionId, extra = {}) => createDoc(who, "talk-question-votes", `${who.uid}_${questionId}`, { ...base, entryKey: questionId, talkKey, ...extra });

/** Pessoa com check-in na palestra. */
async function attendee(talkKey) {
  const who = person();
  const result = await checkin(who, talkKey);
  assert.ok(result.ok, `check-in de preparo falhou: ${JSON.stringify(result.body)}`);
  return who;
}
/** Pergunta já aprovada pelo moderador (preparo). */
async function approvedQuestion(talkKey) {
  const author = await attendee(talkKey);
  assert.ok((await ask(author, talkKey)).ok);
  const id = `${author.uid}_${talkKey}#1`;
  assert.ok((await updateDoc(moderator(), "talk-questions", id, { status: "approved" })).ok);
  return id;
}
const denied = result => assert.ok(!result.ok && result.code === "PERMISSION_DENIED", `esperava PERMISSION_DENIED, veio ${result.status} ${JSON.stringify(result.body).slice(0, 200)}`);
const allowed = result => assert.ok(result.ok, `esperava sucesso, veio ${result.status} ${JSON.stringify(result.body).slice(0, 300)}`);

// ---------- enviar pergunta ----------
test("pergunta: com check-in e durante a palestra é aceita, sempre pendente", { skip }, async () => {
  const talk = LIVE();
  allowed(await ask(await attendee(talk), talk));
});

test("pergunta: sem check-in nessa palestra é recusada", { skip }, async () => {
  const talk = LIVE();
  denied(await ask(person(), talk));
  const otherTalk = talkKeyStarted(11);
  denied(await ask(await attendee(otherTalk), talk)); // check-in em outra palestra não vale
});

test("pergunta: antes de a palestra começar e depois de ela acabar é recusada", { skip: onlyWithWindow }, async () => {
  for (const talk of [NOT_STARTED(), ENDED()]) {
    denied(await ask(await attendee(talk), talk));
  }
});

test("pergunta: perto dos limites da janela (no fim e logo depois)", { skip: onlyWithWindow }, async () => {
  const almostOver = talkKeyStarted(38);
  allowed(await ask(await attendee(almostOver), almostOver));
  const justOver = talkKeyStarted(42);
  denied(await ask(await attendee(justOver), justOver));
  const aboutToStart = talkKeyStarted(-2);
  denied(await ask(await attendee(aboutToStart), aboutToStart));
});

test("pergunta: até 10 por pessoa por palestra, a 11ª e a 0 são recusadas", { skip }, async () => {
  const talk = LIVE();
  const who = await attendee(talk);
  for (let slot = 1; slot <= 10; slot++) allowed(await ask(who, talk, slot));
  denied(await ask(who, talk, 11));
  denied(await ask(who, talk, 0));
  denied(await ask(who, talk, 1)); // o espaço já usado é "update": recusa
});

test("pergunta: espaço fora do formato canônico (#01, #1x) é recusado", { skip }, async () => {
  const talk = LIVE();
  const who = await attendee(talk);
  for (const slot of ["01", "1x", "-1", ""]) {
    denied(await createDoc(who, "talk-questions", `${who.uid}_${talk}#${slot}`, questionData(who, talk, slot)));
  }
});

test("pergunta: o id do documento tem que ser <uid>_<entryKey> (não dá pra furar o limite com ids diferentes)", { skip }, async () => {
  const talk = LIVE();
  const who = await attendee(talk);
  denied(await createDoc(who, "talk-questions", `${who.uid}_extra`, questionData(who, talk, 1)));
  denied(await createDoc(who, "talk-questions", `${who.uid}_${talk}#1x`, questionData(who, talk, 1)));
});

test("pergunta: é sempre da própria pessoa (uid) e da palestra da chave", { skip }, async () => {
  const talk = LIVE();
  const who = await attendee(talk);
  denied(await ask(who, talk, 1, { uid: "outra-pessoa" }));
  const otherTalk = talkKeyStarted(11);
  denied(await ask(who, talk, 1, { talkKey: otherTalk }));
  denied(await ask(who, talk, 1, { entryKey: `${otherTalk}#1` }));
});

test("pergunta: nasce pendente, com texto e nome válidos, sem campo extra", { skip }, async () => {
  const talk = LIVE();
  const who = await attendee(talk);
  denied(await ask(who, talk, 1, { status: "approved" }));
  denied(await ask(who, talk, 1, { text: "" }));
  denied(await ask(who, talk, 1, { text: "x".repeat(281) }));
  denied(await ask(who, talk, 1, { name: "" }));
  denied(await ask(who, talk, 1, { extra: "campo solto" }));
  allowed(await ask(who, talk, 1, { text: "x".repeat(280) }));
});

test("pergunta: chave de palestra fora do formato é recusada", { skip }, async () => {
  const who = person();
  const forged = "qualquer-coisa";
  assert.ok((await checkin(who, forged)).ok);
  denied(await ask(who, forged));
});

// ---------- ler ----------
test("leitura: a plateia lista só as aprovadas da palestra; pendentes ficam escondidas", { skip }, async () => {
  const talk = LIVE();
  const approvedId = await approvedQuestion(talk);
  const pending = await attendee(talk);
  allowed(await ask(pending, talk));
  const reader = person();
  const listed = await query(reader, "talk-questions", { talkKey: talk, status: "approved" });
  allowed(listed);
  assert.deepEqual(listed.ids, [approvedId]);
  denied(await query(reader, "talk-questions", { talkKey: talk })); // sem filtro de status
  denied(await query(reader, "talk-questions", { talkKey: talk, status: "pending" }));
});

test("leitura: cada pessoa lista as próprias (qualquer estado) e só as próprias", { skip }, async () => {
  const talk = LIVE();
  const author = await attendee(talk);
  allowed(await ask(author, talk));
  const mine = await query(author, "talk-questions", { talkKey: talk, uid: author.uid });
  allowed(mine);
  assert.equal(mine.ids.length, 1);
  denied(await query(person(), "talk-questions", { talkKey: talk, uid: author.uid }));
});

test("leitura: a plateia também lista a pergunta que está na vez (approved + current), mas não pending, answered nem rejected", { skip }, async () => {
  const talk = LIVE();
  const mod = moderator();
  const ids = {};
  for (const status of ["approved", "current", "answered", "rejected"]) {
    ids[status] = await approvedQuestion(talk);
    if (status !== "approved") assert.ok((await updateDoc(mod, "talk-questions", ids[status], { status })).ok);
  }
  const author = await attendee(talk);
  assert.ok((await ask(author, talk)).ok); // fica pending
  const reader = person();
  const listed = await query(reader, "talk-questions", { talkKey: talk, status: ["current", "approved"] });
  allowed(listed);
  assert.deepEqual([...listed.ids].sort(), [ids.approved, ids.current].sort());
  allowed(await query(reader, "talk-questions", { talkKey: talk, status: "current" }));
  denied(await query(reader, "talk-questions", { talkKey: talk, status: ["current", "pending"] }));
  denied(await query(reader, "talk-questions", { talkKey: talk, status: ["approved", "answered"] }));
});

test("leitura: sem estar autenticada não lê nada", { skip }, async () => {
  denied(await query(null, "talk-questions", { status: "approved" }));
  denied(await query(null, "talk-question-votes", { talkKey: LIVE() }));
});

// ---------- moderar ----------
test("moderação: só e-mail Google verificado da lista lista tudo e muda o estado", { skip }, async () => {
  const talk = LIVE();
  const author = await attendee(talk);
  allowed(await ask(author, talk));
  const id = `${author.uid}_${talk}#1`;

  denied(await updateDoc(person(), "talk-questions", id, { status: "approved" }));
  denied(await updateDoc(author, "talk-questions", id, { status: "approved" }));
  denied(await updateDoc(google(nextId("g"), "outra.pessoa@gmail.com"), "talk-questions", id, { status: "approved" }));
  denied(await updateDoc(google(nextId("g"), moderatorEmail, false), "talk-questions", id, { status: "approved" }));
  denied(await updateDoc({ uid: nextId("g"), provider: "password", email: moderatorEmail }, "talk-questions", id, { status: "approved" }));

  const mod = moderator();
  allowed(await query(mod, "talk-questions", { talkKey: talk }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "approved" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "answered" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "rejected" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "approved" }));
});

test("moderação: põe na vez (current), tira da vez e devolve pra fila (pending) de qualquer estado", { skip }, async () => {
  const talk = LIVE();
  const id = await approvedQuestion(talk);
  const mod = moderator();
  allowed(await updateDoc(mod, "talk-questions", id, { status: "current" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "approved" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "current" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "pending" })); // devolvida
  allowed(await updateDoc(mod, "talk-questions", id, { status: "approved" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "rejected" }));
  allowed(await updateDoc(mod, "talk-questions", id, { status: "pending" }));
  denied(await updateDoc(person(), "talk-questions", id, { status: "current" })); // plateia não move nada
});

test("moderação: só muda o estado (nunca o texto) e não inventa estado", { skip }, async () => {
  const talk = LIVE();
  const id = await approvedQuestion(talk);
  const mod = moderator();
  denied(await updateDoc(mod, "talk-questions", id, { text: "editado pelo moderador" }));
  denied(await updateDoc(mod, "talk-questions", id, { status: "qualquer" }));
});

test("moderação: o moderador não precisa de check-in e pode moderar depois da janela", { skip }, async () => {
  const talk = LIVE();
  const id = await approvedQuestion(talk);
  const mod = moderator();
  allowed(await updateDoc(mod, "talk-questions", id, { status: "answered" }));
});

// ---------- votos ----------
test("voto: em pergunta aprovada, com check-in, durante a palestra", { skip }, async () => {
  const talk = LIVE();
  const id = await approvedQuestion(talk);
  allowed(await vote(await attendee(talk), talk, id));
});

test("voto: pergunta pendente, rejeitada, respondida ou na vez não recebe voto", { skip }, async () => {
  const talk = LIVE();
  const author = await attendee(talk);
  assert.ok((await ask(author, talk)).ok);
  const pendingId = `${author.uid}_${talk}#1`;
  denied(await vote(await attendee(talk), talk, pendingId));
  const mod = moderator();
  for (const status of ["rejected", "answered", "current"]) {
    const id = await approvedQuestion(talk);
    assert.ok((await updateDoc(mod, "talk-questions", id, { status })).ok);
    denied(await vote(await attendee(talk), talk, id));
  }
});

test("voto: sem check-in, fora da janela, repetido ou com id trocado é recusado", { skip }, async () => {
  const talk = LIVE();
  const id = await approvedQuestion(talk);
  denied(await vote(person(), talk, id));

  const voter = await attendee(talk);
  allowed(await vote(voter, talk, id));
  denied(await vote(voter, talk, id)); // segundo voto = update

  const other = await attendee(talk);
  denied(await createDoc(other, "talk-question-votes", `${other.uid}_qualquer`, { ...base, entryKey: id, talkKey: talk }));
  denied(await vote(other, talk, id, { talkKey: talkKeyStarted(11) })); // palestra que não é a da pergunta
  denied(await vote(other, talk, "pergunta-que-nao-existe"));
});

test("voto: fora da janela da palestra é recusado, mesmo em pergunta aprovada", { skip: onlyWithWindow }, async () => {
  const past = talkKeyStarted(60);
  // pergunta aprovada por preparo direto (a janela já fechou para criar de forma normal)
  const author = person();
  const questionId = `${author.uid}_${past}#1`;
  assert.ok((await seed("talk-questions", questionId, { ...questionData(author, past), status: "approved" })).ok);
  denied(await vote(await attendee(past), past, questionId));
});

test("leitura dos votos: só autenticada; contar votos por palestra funciona", { skip }, async () => {
  const talk = LIVE();
  const id = await approvedQuestion(talk);
  allowed(await vote(await attendee(talk), talk, id));
  const listed = await query(person(), "talk-question-votes", { talkKey: talk });
  allowed(listed);
  assert.equal(listed.ids.length, 1);
});

// ---------- trava de horário desligada (teste em DEV) ----------
test("sem a trava de horário: pergunta e voto valem antes, durante e depois da palestra, mas o resto das travas segue", { skip: onlyWithoutWindow }, async () => {
  for (const talk of [NOT_STARTED(), LIVE(), ENDED()]) {
    const who = await attendee(talk);
    allowed(await ask(who, talk));
    const id = await approvedQuestion(talk);
    allowed(await vote(await attendee(talk), talk, id));
  }
  const talk = ENDED();
  denied(await ask(person(), talk)); // sem check-in continua recusado
  const who = await attendee(talk);
  denied(await ask(who, talk, 11)); // limite continua valendo
  denied(await ask(who, talk, 1, { status: "approved" })); // e o moderador continua sendo o único que aprova
});
