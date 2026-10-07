/**
 * Testes de TELA do concurso da sessão na tela do moderador (docs/js/features/contest-moderation.js + components/contest-moderation.js)
 * em jsdom, ligado à moderação de perguntas como na página real: projetos com votos em ordem, apagar com dois toques, publicar o pódio, erros
 * e a volta às perguntas quando a sala passa pra outra palestra. Repositories falsos (projetos e votos = "questions", pódio = "boards").
 *   node --test DevFestIA/tools/dom/contest-moderation.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, flush, settle, waitFor, textOf } = require("../lib/dom-harness.js");
const { createFakeQuestions, createFakeBoards, denied } = require("../lib/fake-question-world.js");

const site = loadSite({
  scripts: [...SITE_BASE, "data/talk-questions.js", "data/talk-contest.js", "data/favorites.js", "features/live-status.js", "features/room-board.js", "features/question-ranking.js",
    "features/board-snapshot.js", "features/board-publisher.js", "components/talk-questions.js", "components/moderator-login.js", "components/question-moderation.js",
    "components/contest-moderation.js", "features/moderator-login.js", "features/question-moderation.js", "features/contest-ranking.js", "features/contest-moderation.js"],
});
const { window, document } = site;
test.after(() => window.close());
const initQuestionModeration = site.get("initQuestionModeration");
const createContestModeration = site.get("createContestModeration");
const baseConfig = { ...site.get("TALK_QUESTIONS"), boardPublishMs: 40, publishVotes: false };
const contestConfig = { ...site.get("TALK_CONTEST"), moderatorRefreshMs: 40 };

const track = { id: "ia", label: "IA", room: "Sala Observatório" };
const JAM = { start: new Date("2026-11-28T12:00:00Z"), end: new Date("2026-11-28T12:40:00Z"), talks: { ia: { title: "GDG Campinas Coding Jam", highlight: "codejam" } } };
const NEXT = { start: new Date("2026-11-28T13:00:00Z"), end: new Date("2026-11-28T13:40:00Z"), talks: { ia: { title: "RAG na prática" } } };
const KEY = `${JAM.start.toISOString()}|ia`;
const plain = value => JSON.parse(JSON.stringify(value));

/** Tela de moderação de um slot com concurso (o relógio decide a palestra), já com login do moderador. */
function setup({ now = () => new Date("2026-11-28T12:10:00Z"), schedule = [JAM, NEXT] } = {}) {
  const questions = createFakeQuestions();
  const votesOfQuestions = createFakeQuestions();
  const boards = createFakeBoards();
  const projects = createFakeQuestions();
  const contestVotes = createFakeQuestions();
  const results = createFakeBoards();
  document.body.innerHTML = `<main id="modBody"></main>`;
  const rootEl = document.getElementById("modBody");
  initQuestionModeration(rootEl, {
    schedule, track, config: baseConfig, now,
    pinnedCode: null,
    codeOf: () => "0900.ia",
    contest: createContestModeration({ rootEl, config: contestConfig, deps: () => ({ projects, votes: contestVotes, results }) }),
    deps: () => ({
      questions, votes: votesOfQuestions, boards,
      signIn: async () => "mod@gdg.dev", restore: async () => "mod@gdg.dev", signOut: async () => {},
    }),
    whenReady: task => task(),
  });
  const seedProject = (uid, project, name) => projects.seed({ id: `${uid}_${KEY}`, talkKey: KEY, uid, project, name });
  const seedVote = (voter, projectUid) => contestVotes.seed({ id: `${voter}_${KEY}`, talkKey: KEY, projectId: `${projectUid}_${KEY}` });
  const rows = () => [...rootEl.querySelectorAll(".question-item--moderation")].map(textOf);
  const press = async selector => { rootEl.querySelector(selector).click(); await settle(); };
  return { questions, projects, contestVotes, results, rootEl, seedProject, seedVote, rows, press };
}

test("sessão com concurso: mostra os projetos por votos (placar só aqui) e não escuta perguntas", async () => {
  const world = setup();
  world.seedProject("ana", "App da Ana", "Ana");
  world.seedProject("bia", "Jogo da Bia", "Bia");
  world.seedVote("v1", "bia"); world.seedVote("v2", "bia"); world.seedVote("v3", "ana");
  await settle(6);
  assert.match(textOf(world.rootEl), /GDG Campinas Coding Jam/);
  assert.deepEqual(world.rows(), ["2 Jogo da BiaBia Apagar", "1 App da AnaAna Apagar"], "votos, projeto, pessoa e a ação, em ordem de votos");
  assert.equal(world.questions.listenCount(), 0, "perguntas desligadas nessa sessão");
  assert.ok(world.rootEl.querySelector("[data-contest-publish]"));
  assert.match(textOf(world.rootEl), /ainda não foi publicado/);
});

test("publicar: grava o pódio dos mais votados (só quem tem voto) e avisa que está no ar", async () => {
  const world = setup();
  world.seedProject("ana", "App da Ana", "Ana");
  world.seedProject("bia", "Jogo da Bia", "Bia");
  world.seedProject("caio", "Sem votos", "Caio");
  world.seedVote("v1", "bia"); world.seedVote("v2", "bia"); world.seedVote("v3", "ana");
  await settle(6);
  await world.press("[data-contest-publish]");
  assert.equal(world.results.sets.length, 1);
  assert.equal(world.results.sets[0].key, KEY);
  assert.deepEqual(plain(world.results.sets[0].data), { podium: [{ place: 1, project: "Jogo da Bia", name: "Bia" }, { place: 2, project: "App da Ana", name: "Ana" }] });
  assert.match(textOf(world.rootEl), /Pódio publicado \(2 de 3 lugares\)/);
});

test("publicar sem nenhum voto: avisa e não grava nada", async () => {
  const world = setup();
  world.seedProject("ana", "App da Ana", "Ana");
  await settle(6);
  await world.press("[data-contest-publish]");
  assert.equal(world.results.sets.length, 0);
  assert.match(textOf(world.rootEl), /Ainda não há votos/);
});

test("pódio já publicado aparece no estado da tela e pode ser republicado", async () => {
  const world = setup();
  world.seedProject("ana", "App da Ana", "Ana");
  world.seedVote("v1", "ana");
  world.results.emit(KEY, { podium: [{ place: 1, project: "Antigo", name: "Zé" }] });
  await settle(6);
  assert.match(textOf(world.rootEl), /Pódio publicado \(1 de 3 lugares\)/);
  await world.press("[data-contest-publish]");
  assert.equal(world.results.sets.length, 1);
});

test("apagar projeto: o primeiro toque só arma ('Apagar mesmo?'), o segundo apaga e a lista recarrega", async () => {
  const world = setup();
  world.seedProject("ana", "App da Ana", "Ana");
  world.seedProject("bia", "Nome errado", "Bia");
  await settle(6);
  await world.press(`[data-contest-delete="bia_${KEY}"]`);
  assert.equal(world.projects.docs.length, 2, "ainda não apagou");
  assert.match(textOf(world.rootEl), /Apagar mesmo\?/);
  await world.press(`[data-contest-delete="bia_${KEY}"]`);
  assert.deepEqual(world.projects.docs.map(doc => doc.id), [`ana_${KEY}`]);
  assert.ok(!textOf(world.rootEl).includes("Nome errado"));
});

test("Atualizar (e o ciclo automático) recontam os votos que chegaram depois", async () => {
  const world = setup();
  world.seedProject("ana", "App da Ana", "Ana");
  world.seedProject("bia", "Jogo da Bia", "Bia");
  await settle(6);
  assert.match(world.rows()[0], /^0 App da Ana/);
  world.seedVote("v1", "bia");
  await world.press("[data-contest-refresh]");
  assert.match(world.rows()[0], /^1 Jogo da Bia/);
});

test("conta sem permissão: o aviso aparece na própria tela", async () => {
  const world = setup();
  world.projects.getWhere = async () => { throw denied(); };
  await settle(6);
  assert.match(textOf(world.rootEl), /Sem permissão: essa conta não está na lista de moderadores/);
});

test("falha ao publicar: avisa e o pódio não fica como publicado", async () => {
  const world = setup();
  world.seedProject("ana", "App da Ana", "Ana");
  world.seedVote("v1", "ana");
  world.results.failSetWith = new Error("offline");
  await settle(6);
  await world.press("[data-contest-publish]");
  assert.match(textOf(world.rootEl), /Não consegui publicar o pódio agora/);
  assert.match(textOf(world.rootEl), /ainda não foi publicado/);
});

test("quando a sala passa pra outra palestra: para de contar o concurso e volta a moderar perguntas", async () => {
  let clock = new Date("2026-11-28T12:10:00Z");
  const world = setup({ now: () => clock });
  world.seedProject("ana", "App da Ana", "Ana");
  await settle(6);
  assert.equal(world.questions.listenCount(), 0);
  clock = new Date("2026-11-28T13:10:00Z");
  await waitFor(() => world.questions.listenCount() === 1);
  assert.equal(world.questions.listenCount(), 1, "a palestra seguinte tem perguntas");
  assert.match(textOf(world.rootEl), /RAG na prática/);
  assert.equal(world.rootEl.querySelector("[data-contest-publish]"), null);
});
