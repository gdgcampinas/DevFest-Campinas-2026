/**
 * Testa as REGRAS do Firestore do concurso da sessão (Coding Jam) contra o emulador (nada toca o banco real): cadastro do projeto
 * (um por check-in, só na sessão, só com check-in), voto (um por check-in, nunca no próprio projeto, só em projeto da mesma
 * sessão, placar só do moderador) e pódio (só o moderador grava). Mesma estrutura dos outros testes de regras; rodar com
 *   DevFestIA/tools/questions/run-rules-tests.sh   (duas vezes: trava de horário ligada e como está no arquivo)
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createDoc, updateDoc, deleteDoc, getDoc, query } = require("../lib/firestore-emulator.js");
const { skip, onlyWithWindow, person, moderator, talkKeyStarted, LIVE, NOT_STARTED, ENDED, base, attendee, denied, allowed } = require("../lib/rules-test-kit.js");

const projectData = (who, talkKey, extra = {}) => ({ ...base, entryKey: talkKey, talkKey, uid: who.uid, name: "Ana", project: "App de doação", ...extra });
const register = (who, talkKey, extra = {}) => createDoc(who, "contest-projects", `${who.uid}_${talkKey}`, projectData(who, talkKey, extra));
const voteFor = (who, talkKey, projectId, extra = {}) => createDoc(who, "contest-votes", `${who.uid}_${talkKey}`, { ...base, entryKey: talkKey, talkKey, projectId, ...extra });
const projectIdOf = (who, talkKey) => `${who.uid}_${talkKey}`;
const listProjects = (who, talkKey) => query(who, "contest-projects", { edition: "2026", talkKey });
const podiumData = (extra = {}) => ({ ...base, podium: [{ place: 1, project: "App de doação", name: "Ana" }], ...extra });
const putPodium = (who, talkKey, data = podiumData()) => createDoc(who, "contest-results", talkKey, { edition: data.edition, podium: data.podium, ...data }, { stamp: "updatedAt" });

/** Pessoa com check-in e projeto cadastrado na sessão. */
async function participant(talkKey) {
  const who = await attendee(talkKey);
  allowed(await register(who, talkKey));
  return who;
}

// ---------- cadastro do projeto ----------
test("projeto: com check-in e durante a sessão é aceito", { skip }, async () => {
  const talk = LIVE();
  allowed(await register(await attendee(talk), talk));
});

test("projeto: sem check-in nessa sessão é recusado (nem o de outra sessão serve)", { skip }, async () => {
  const talk = LIVE();
  denied(await register(person(), talk));
  const other = talkKeyStarted(11);
  const who = await attendee(other);
  denied(await register(who, talk));
});

test("projeto: antes de a sessão começar e depois de ela acabar é recusado", { skip: onlyWithWindow }, async () => {
  const early = NOT_STARTED();
  denied(await register(await attendee(early), early));
  const late = ENDED();
  denied(await register(await attendee(late), late));
});

test("projeto: um por check-in (o segundo, no mesmo id, é recusado) e o id tem que ser <uid>_<talkKey>", { skip }, async () => {
  const talk = LIVE();
  const who = await attendee(talk);
  allowed(await register(who, talk));
  denied(await register(who, talk, { project: "Outro nome" }));
  const another = await attendee(talk);
  denied(await createDoc(another, "contest-projects", `${another.uid}_${talk}x`, projectData(another, talk)));
  denied(await createDoc(another, "contest-projects", "qualquer-id", projectData(another, talk)));
});

test("projeto: é sempre da própria pessoa e da sessão da chave; sem campo extra e com textos válidos", { skip }, async () => {
  const talk = LIVE();
  const who = await attendee(talk);
  denied(await register(who, talk, { uid: "outra-pessoa" }));
  denied(await register(who, talk, { talkKey: talkKeyStarted(12) }));
  denied(await register(who, talk, { extra: "campo a mais" }));
  denied(await register(who, talk, { project: "" }));
  denied(await register(who, talk, { name: "" }));
  denied(await register(who, talk, { project: "x".repeat(81) }));
  denied(await register(who, talk, { name: "y".repeat(81) }));
  allowed(await register(who, talk, { project: "x".repeat(80), name: "y".repeat(80) }));
});

test("projeto: chave de sessão fora do formato é recusada", { skip }, async () => {
  const who = person();
  denied(await createDoc(who, "contest-projects", `${who.uid}_qualquer`, projectData(who, "qualquer")));
});

test("projeto: ninguém edita; só o moderador apaga (o erro de digitação se corrige apagando e cadastrando de novo)", { skip }, async () => {
  const talk = LIVE();
  const who = await participant(talk);
  const id = projectIdOf(who, talk);
  denied(await updateDoc(who, "contest-projects", id, { project: "Trocado" }));
  denied(await deleteDoc(who, "contest-projects", id));
  allowed(await deleteDoc(moderator(), "contest-projects", id));
  allowed(await register(who, talk, { project: "Corrigido" }));
});

test("projeto, leitura: quem tem check-in na sessão e o moderador listam; sem check-in ou sem login não", { skip }, async () => {
  const talk = LIVE();
  const owner = await participant(talk);
  const other = await attendee(talk);
  const listed = await listProjects(other, talk);
  allowed(listed);
  assert.deepEqual(listed.ids, [projectIdOf(owner, talk)]);
  allowed(await listProjects(moderator(), talk));
  denied(await listProjects(person(), talk));
  denied(await listProjects(null, talk));
  denied(await query(other, "contest-projects", { edition: "2026" }), "sem filtrar por sessão nada é listado");
});

// ---------- voto ----------
test("voto: com check-in, durante a sessão, em projeto de outra pessoa da mesma sessão", { skip }, async () => {
  const talk = LIVE();
  const author = await participant(talk);
  const voter = await attendee(talk);
  allowed(await voteFor(voter, talk, projectIdOf(author, talk)));
});

test("voto: nunca no próprio projeto", { skip }, async () => {
  const talk = LIVE();
  const author = await participant(talk);
  denied(await voteFor(author, talk, projectIdOf(author, talk)));
});

test("voto: um por check-in, sem desfazer nem trocar", { skip }, async () => {
  const talk = LIVE();
  const first = await participant(talk);
  const second = await participant(talk);
  const voter = await attendee(talk);
  allowed(await voteFor(voter, talk, projectIdOf(first, talk)));
  denied(await voteFor(voter, talk, projectIdOf(second, talk)), "o segundo voto cai no mesmo id e vira update");
  denied(await updateDoc(voter, "contest-votes", `${voter.uid}_${talk}`, { projectId: projectIdOf(second, talk) }));
  denied(await deleteDoc(voter, "contest-votes", `${voter.uid}_${talk}`));
});

test("voto: sem check-in é recusado", { skip }, async () => {
  const talk = LIVE();
  const author = await participant(talk);
  denied(await voteFor(person(), talk, projectIdOf(author, talk)));
});

test("voto: projeto inexistente ou de outra sessão é recusado", { skip }, async () => {
  const talk = LIVE();
  const otherTalk = talkKeyStarted(12);
  const stranger = await participant(otherTalk);
  const voter = await attendee(talk);
  denied(await voteFor(voter, talk, `${voter.uid}_nao-existe`));
  denied(await voteFor(voter, talk, projectIdOf(stranger, otherTalk)));
  denied(await voteFor(voter, talk, 42));
});

test("voto: campos e id no formato certo, sem campo extra", { skip }, async () => {
  const talk = LIVE();
  const author = await participant(talk);
  const voter = await attendee(talk);
  denied(await voteFor(voter, talk, projectIdOf(author, talk), { extra: "campo a mais" }));
  denied(await voteFor(voter, talk, projectIdOf(author, talk), { talkKey: talkKeyStarted(12) }));
  denied(await createDoc(voter, "contest-votes", "qualquer-id", { ...base, entryKey: talk, talkKey: talk, projectId: projectIdOf(author, talk) }));
});

test("voto: fora da janela da sessão é recusado", { skip: onlyWithWindow }, async () => {
  const early = NOT_STARTED();
  const earlyAuthor = await participant(early).catch(() => null); // o projeto também é recusado antes de a sessão começar
  assert.equal(earlyAuthor, null);
  const late = ENDED();
  const voter = await attendee(late);
  denied(await voteFor(voter, late, `${voter.uid}x_${late}`));
});

test("voto, leitura: a plateia nunca lista o placar nem lê o voto dos outros; o moderador lista", { skip }, async () => {
  const talk = LIVE();
  const author = await participant(talk);
  const voter = await attendee(talk);
  allowed(await voteFor(voter, talk, projectIdOf(author, talk)));
  allowed(await getDoc(voter, "contest-votes", `${voter.uid}_${talk}`));
  denied(await getDoc(author, "contest-votes", `${voter.uid}_${talk}`));
  denied(await query(voter, "contest-votes", { edition: "2026", talkKey: talk }));
  const listed = await query(moderator(), "contest-votes", { edition: "2026", talkKey: talk });
  allowed(listed);
  assert.deepEqual(listed.ids, [`${voter.uid}_${talk}`]);
});

// ---------- pódio ----------
test("pódio: só o moderador grava; qualquer pessoa autenticada lê por id e ninguém lista", { skip }, async () => {
  const talk = LIVE();
  const mod = moderator();
  allowed(await putPodium(mod, talk));
  allowed(await getDoc(person(), "contest-results", talk));
  denied(await getDoc(null, "contest-results", talk));
  denied(await query(person(), "contest-results", { edition: "2026" }));
  denied(await putPodium(await attendee(talk), talk));
  denied(await putPodium(null, talk));
  allowed(await putPodium(mod, talk, podiumData({ podium: [{ place: 1, project: "Novo", name: "Bia" }] })), "o moderador pode republicar");
});

test("pódio: formato (sessão válida, lista de até 10, sem campo extra, horário do servidor)", { skip }, async () => {
  const mod = moderator();
  denied(await putPodium(mod, "qualquer"));
  denied(await putPodium(mod, LIVE(), podiumData({ podium: Array.from({ length: 11 }, (_, i) => ({ place: i + 1, project: "p", name: "n" })) })));
  denied(await putPodium(mod, LIVE(), podiumData({ podium: "não é lista" })));
  denied(await putPodium(mod, LIVE(), { ...podiumData(), extra: "campo a mais" }));
  denied(await putPodium(mod, LIVE(), podiumData({ edition: "1999" })));
  denied(await createDoc(mod, "contest-results", LIVE(), podiumData(), { stamp: "criadoEm" }), "sem o horário do servidor");
  allowed(await putPodium(mod, LIVE(), podiumData({ podium: [] })));
});
