/**
 * Testes de TELA do pódio do concurso no quadro da sala (docs/js/features/board-contest.js + boardContestMarkup): lugares vazios até o
 * resultado sair, papel picado só quando o pódio aparece AO VIVO, escuta de um documento por sessão e erros. Repository do pódio falso
 * (o mesmo mock do quadro das perguntas) e papel picado falso.
 *   node --test DevFestIA/tools/dom/board-contest.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeBoards } = require("../lib/fake-question-world.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/talk-highlight.js", "components/room-board.js", "features/board-contest.js"] });
const { window, document } = site;
test.after(() => window.close());
const createBoardContest = site.get("createBoardContest");
const jam = site.get("talkHighlightsRepository").getById("codejam");

const KEY = "2026-11-28T17:15:00.000Z|mobile";
const OTHER = "2026-11-28T17:15:00.000Z|ia";
const PODIUM = [{ place: 1, project: "App da Ana", name: "Ana" }, { place: 2, project: "<b>Jogo</b>", name: "Bia" }];

function setup({ key = KEY } = {}) {
  document.body.innerHTML = `<section id="cdContest"></section><section id="cdContest2"></section>`;
  const results = createFakeBoards();
  const fired = [];
  const board = createBoardContest({
    deps: () => ({ results, getUid: async () => "tv" }),
    whenReady: task => task(),
    confetti: { fire: options => { fired.push(options); return true; } },
  });
  const mountEl = document.getElementById("cdContest");
  const follow = async (next = { mountEl, key, highlight: jam }) => { board.follow(next); await settle(); };
  const slots = (el = mountEl) => [...el.querySelectorAll(".talk-podium-slot")].map(textOf);
  return { results, fired, board, mountEl, follow, slots };
}

test("sem pódio publicado: título, dica e os lugares vazios", async () => {
  const world = setup();
  await world.follow();
  assert.match(textOf(world.mountEl), /Pódio/);
  assert.match(textOf(world.mountEl), /O resultado aparece aqui quando a organização publicar/);
  assert.deepEqual(world.slots(), ["1º lugar", "2º lugar", "3º lugar"]);
  assert.equal(world.fired.length, 0);
});

test("o pódio sai AO VIVO: preenche os lugares e dispara o papel picado, forçado (vale mesmo com 'Reduzir movimento')", async () => {
  const world = setup();
  await world.follow();
  world.results.emit(KEY, { podium: PODIUM });
  const slots = world.slots();
  assert.match(slots[0], /1º lugar.*App da Ana.*Ana/);
  assert.match(slots[1], /2º lugar.*<b>Jogo<\/b>.*Bia/, "texto da plateia escapado");
  assert.equal(slots[2], "3º lugar");
  assert.match(textOf(world.mountEl), /Parabéns/);
  assert.equal(world.fired.length, 1);
  assert.equal(world.fired[0].force, true);
  assert.equal(typeof world.fired[0].origin.x, "number");
});

test("quadro recarregado com o pódio já publicado: mostra o resultado e NÃO dispara papel picado", async () => {
  const world = setup();
  world.results.emit(KEY, { podium: PODIUM });
  await world.follow();
  assert.match(world.slots()[0], /App da Ana/);
  assert.equal(world.fired.length, 0);
});

test("o moderador republica o pódio: atualiza a tela sem repetir o papel picado", async () => {
  const world = setup();
  await world.follow();
  world.results.emit(KEY, { podium: PODIUM });
  world.results.emit(KEY, { podium: [{ place: 1, project: "Jogo da Bia", name: "Bia" }] });
  assert.match(world.slots()[0], /Jogo da Bia/);
  assert.equal(world.fired.length, 1, "só na primeira vez que o resultado aparece");
});

test("seguir outra sessão para de escutar a anterior e escuta a nova; follow(null) para tudo", async () => {
  const world = setup();
  await world.follow();
  assert.equal(world.results.listenCount(KEY), 1);
  await world.follow({ mountEl: world.mountEl, key: OTHER, highlight: jam });
  assert.equal(world.results.listenCount(KEY), 0);
  assert.equal(world.results.listenCount(OTHER), 1);
  await world.follow(null);
  assert.equal(world.results.listenCount(OTHER), 0);
});

test("a tela foi redesenhada (mesma sessão, outro lugar na página): redesenha sem abrir outro listener", async () => {
  const world = setup();
  await world.follow();
  world.results.emit(KEY, { podium: PODIUM });
  const second = document.getElementById("cdContest2");
  await world.follow({ mountEl: second, key: KEY, highlight: jam });
  assert.equal(world.results.listenCount(KEY), 1);
  assert.match(world.slots(second)[0], /App da Ana/);
});

test("falha ao ler: avisa 'sem conexão' e mantém o último estado", async () => {
  const world = setup();
  world.results.listen = (key, onNext, onError) => { onError(new Error("offline")); return () => {}; };
  await world.follow();
  assert.match(textOf(world.mountEl), /sem conexão, tentando de novo/);
  assert.deepEqual(world.slots(), ["1º lugar", "2º lugar", "3º lugar"]);
});
