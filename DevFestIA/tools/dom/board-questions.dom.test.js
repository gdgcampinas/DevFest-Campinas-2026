/**
 * Testes de TELA das perguntas no quadro da sala/TV (docs/js/features/board-questions.js + components/room-board.js) em jsdom, com o
 * quadro da palestra falso: lista na ordem publicada, troca de palestra, fase encerrada e falha de leitura.
 *   node --test DevFestIA/tools/dom/board-questions.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeBoards } = require("../lib/fake-question-world.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/room-board.js", "features/board-questions.js"] });
const { window, document } = site;
test.after(() => window.close());
const createBoardQuestions = site.get("createBoardQuestions");

const A = "2026-11-28T12:00:00.000Z|ia";
const B = "2026-11-28T13:00:00.000Z|ia";
const board = (...texts) => ({ questions: texts.map((text, i) => ({ id: `q${i}`, text, name: `Autor ${i}` })) });

function setup({ limit = 6, getUid = async () => "tv" } = {}) {
  document.body.innerHTML = `<section id="one"></section><section id="two"></section>`;
  const boards = createFakeBoards();
  const board_ = createBoardQuestions({ deps: () => ({ boards, getUid }), limit, whenReady: task => task() });
  return { boards, follow: board_.follow, one: document.getElementById("one"), two: document.getElementById("two") };
}
const lines = mountEl => [...mountEl.querySelectorAll(".cd-question-text")].map(textOf);

test("mostra as perguntas aprovadas na ordem em que a moderação publicou, sem número de votos", async () => {
  const world = setup();
  world.boards.emit(A, board("Primeira", "Segunda"));
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  assert.deepEqual(lines(world.one), ["Primeira", "Segunda"]);
  assert.equal(world.one.querySelector(".cd-question-votes"), null);
  assert.match(textOf(world.one), /Perguntas ao vivo/);
});

test("mostra o número de votos quando o quadro publica", async () => {
  const world = setup();
  world.boards.emit(A, { questions: [{ id: "q", text: "Com voto", name: "x", votes: 4 }] });
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  assert.match(textOf(world.one.querySelector(".cd-question-votes")), /4\s*votos/);
});

test("sem nenhuma aprovada mostra o aviso; quando a moderação publica, a lista aparece sozinha", async () => {
  const world = setup();
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  assert.match(textOf(world.one), /Nenhuma pergunta aprovada ainda/);
  world.boards.emit(A, board("Chegou"));
  assert.deepEqual(lines(world.one), ["Chegou"]);
});

test("mostra só as `limit` primeiras", async () => {
  const world = setup({ limit: 2 });
  world.boards.emit(A, board("1", "2", "3", "4"));
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  assert.deepEqual(lines(world.one), ["1", "2"]);
});

test("palestra encerrada: título de perguntas encerradas", async () => {
  const world = setup();
  world.boards.emit(A, board("Antiga"));
  world.follow({ mountEl: world.one, key: A, phase: "closed" });
  await settle();
  assert.match(textOf(world.one), /Perguntas encerradas/);
  assert.deepEqual(lines(world.one), ["Antiga"]);
});

test("a sala passa pra outra palestra: para de escutar a antiga, limpa e escuta a nova", async () => {
  const world = setup();
  world.boards.emit(A, board("Da primeira"));
  world.boards.emit(B, board("Da segunda"));
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  assert.equal(world.boards.listenCount(A), 1);
  world.follow({ mountEl: world.one, key: B, phase: "open" });
  await settle();
  assert.equal(world.boards.listenCount(A), 0);
  assert.equal(world.boards.listenCount(B), 1);
  assert.deepEqual(lines(world.one), ["Da segunda"]);
  world.boards.emit(A, board("Atrasada da primeira")); // ninguém mais escuta A
  assert.deepEqual(lines(world.one), ["Da segunda"]);
});

test("a tela é redesenhada com a mesma palestra: só troca onde desenha, sem escutar de novo", async () => {
  const world = setup();
  world.boards.emit(A, board("Uma"));
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  world.follow({ mountEl: world.two, key: A, phase: "open" });
  await settle();
  assert.equal(world.boards.listenCount(A), 1);
  assert.deepEqual(lines(world.two), ["Uma"]);
  world.boards.emit(A, board("Uma", "Duas"));
  assert.deepEqual(lines(world.two), ["Uma", "Duas"]);
});

test("follow(null): sem palestra na sala, para de escutar", async () => {
  const world = setup();
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  world.follow(null);
  assert.equal(world.boards.listenCount(A), 0);
});

test("falha na leitura: mantém a última lista e avisa que está sem conexão", async () => {
  const world = setup();
  let fail;
  world.boards.listen = (key, onNext, onError) => { fail = onError; onNext(board("Ficou")); return () => {}; };
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  await settle();
  fail(new Error("offline"));
  assert.deepEqual(lines(world.one), ["Ficou"]);
  assert.match(textOf(world.one), /sem conexão/);
});

test("a sala mudou de palestra enquanto o login ainda entrava: não escuta a palestra velha", async () => {
  let release;
  const world = setup({ getUid: () => new Promise(resolve => { release = resolve; }) });
  world.follow({ mountEl: world.one, key: A, phase: "open" });
  world.follow({ mountEl: world.one, key: B, phase: "open" });
  release("tv");
  await settle();
  assert.equal(world.boards.listenCount(A), 0);
});
