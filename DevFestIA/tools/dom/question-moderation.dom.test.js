/**
 * Testes de TELA da moderação de perguntas (docs/js/features/question-moderation.js + components/question-moderation.js) em
 * jsdom, com repositories falsos: login, seções, botões de estado e, principalmente, a publicação do quadro público da
 * palestra (o que a plateia e a TV leem): ordem por votos, só regrava quando a ordem muda, só as aprovadas.
 *   node --test DevFestIA/tools/dom/question-moderation.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, flush, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeQuestions, createFakeVotes, createFakeBoards, denied } = require("../lib/fake-question-world.js");

const site = loadSite({
  scripts: [...SITE_BASE, "data/talk-questions.js", "data/favorites.js", "features/live-status.js", "features/room-board.js", "features/question-ranking.js",
    "features/board-snapshot.js", "features/board-publisher.js", "components/talk-questions.js", "components/question-moderation.js", "features/question-moderation.js"],
});
const { window, document } = site;
test.after(() => window.close());
const initQuestionModeration = site.get("initQuestionModeration");
const baseConfig = { ...site.get("TALK_QUESTIONS"), boardPublishMs: 40, publishVotes: false };

const track = { id: "ia", label: "IA", room: "Sala Observatório" };
const slotOf = (startIso, endIso, title) => ({ start: new Date(startIso), end: new Date(endIso), talks: { ia: { title } } });
const FIRST = slotOf("2026-11-28T12:00:00Z", "2026-11-28T12:40:00Z", "Agentes de IA");
const SECOND = slotOf("2026-11-28T13:00:00Z", "2026-11-28T13:40:00Z", "RAG na prática");
const keyOf = slot => `${slot.start.toISOString()}|ia`;
const KEY = keyOf(FIRST);

/** Tela de moderação sobre a primeira palestra (fixada por `pinnedCode`, a menos que `pinned: false` e o relógio decida). */
function setup({ signedIn = false, pinned = true, now = () => new Date("2026-11-28T12:10:00Z"), schedule = [FIRST, SECOND], config = {} } = {}) {
  const questions = createFakeQuestions();
  const votes = createFakeVotes();
  const boards = createFakeBoards();
  const auth = { email: signedIn ? "mod@gdg.dev" : null, signInError: null };
  document.body.innerHTML = `<main id="modBody"></main>`;
  const rootEl = document.getElementById("modBody");
  initQuestionModeration(rootEl, {
    schedule, track, config: { ...baseConfig, ...config }, now,
    pinnedCode: pinned ? "0900.ia" : null,
    codeOf: slot => (slot === FIRST ? "0900.ia" : "1000.ia"),
    deps: () => ({
      questions, votes, boards,
      signIn: async () => { if (auth.signInError) throw auth.signInError; auth.email = "mod@gdg.dev"; return auth.email; },
      restore: async () => auth.email,
      signOut: async () => { auth.email = null; },
    }),
    whenReady: task => task(),
  });
  const seed = (id, text, status = "pending", extra = {}) => questions.seed({ id, talkKey: KEY, uid: `u_${id}`, text, name: `Autor ${id}`, status, ...extra });
  const card = text => [...rootEl.querySelectorAll(".question-item--moderation")].find(item => item.querySelector(".question-text").textContent === text);
  const press = async (text, to) => { card(text).querySelector(`[data-question-set="${to}"]`).click(); await settle(); };
  const sectionTexts = title => {
    const section = [...rootEl.querySelectorAll(".mod-section")].find(el => el.querySelector("h3").textContent.trim().startsWith(title));
    return section ? [...section.querySelectorAll(".question-text")].map(el => el.textContent) : [];
  };
  const signIn = async () => { rootEl.querySelector("[data-mod-signin]").click(); await settle(); };
  const lastBoard = () => boards.sets.at(-1)?.data.questions.map(item => item.text);
  return { questions, votes, boards, auth, rootEl, seed, card, press, sectionTexts, signIn, lastBoard };
}

test("sem login: pede o login do Google e não lê nada do banco", async () => {
  const world = setup();
  await settle();
  assert.match(textOf(world.rootEl), /Entrar com Google/);
  assert.equal(world.questions.listenCount(), 0);
});

test("entrar: mostra a conta, a palestra e as perguntas por seção, ouvindo o banco em vez de repetir consultas", async () => {
  const world = setup();
  world.seed("p1", "Na fila", "pending");
  world.seed("a1", "No ar", "approved");
  world.seed("r1", "Respondida antes", "answered");
  world.seed("x1", "Rejeitada antes", "rejected");
  await world.signIn();
  assert.match(textOf(world.rootEl), /mod@gdg\.dev/);
  assert.match(textOf(world.rootEl), /Agentes de IA/);
  assert.deepEqual(world.sectionTexts("Fila"), ["Na fila"]);
  assert.deepEqual(world.sectionTexts("No ar"), ["No ar"]);
  assert.deepEqual(world.sectionTexts("Respondidas"), ["Respondida antes"]);
  assert.deepEqual(world.sectionTexts("Rejeitadas"), ["Rejeitada antes"]);
  assert.equal(world.questions.listenCount(), 1);
  assert.equal(world.questions.reads.length, 0); // nada de consulta repetida
});

test("aprovar move a pergunta pro ar e publica o quadro da palestra com ela", async () => {
  const world = setup();
  world.seed("p1", "Como medir agentes?", "pending");
  await world.signIn();
  assert.equal(world.lastBoard(), undefined); // nada aprovado: nada publicado ainda
  await world.press("Como medir agentes?", "approved");
  assert.deepEqual(world.sectionTexts("No ar"), ["Como medir agentes?"]);
  assert.deepEqual(world.lastBoard(), ["Como medir agentes?"]);
  assert.equal(world.boards.sets.at(-1).key, KEY);
});

test("o quadro sai na ordem dos votos (contados no servidor), sem o número, e a moderação mostra o número", async () => {
  const world = setup();
  world.seed("a1", "Menos votada", "approved");
  world.seed("b1", "Mais votada", "approved");
  world.votes.counts = { a1: 1, b1: 5 };
  await world.signIn();
  assert.deepEqual(world.lastBoard(), ["Mais votada", "Menos votada"]);
  assert.equal(world.boards.sets.at(-1).data.questions[0].votes, undefined);
  const votesShown = [...world.rootEl.querySelectorAll(".mod-section .question-item")].map(item => textOf(item.querySelector(".question-votes")));
  assert.deepEqual(votesShown, ["5", "1"]);
});

test("com publishVotes ligado o quadro leva o número de votos", async () => {
  const world = setup({ config: { publishVotes: true } });
  world.seed("a1", "Única", "approved");
  world.votes.counts = { a1: 3 };
  await world.signIn();
  assert.equal(world.boards.sets.at(-1).data.questions[0].votes, 3);
});

test("só conta votos das aprovadas (pendentes, rejeitadas e respondidas não gastam consulta)", async () => {
  const world = setup();
  world.seed("p1", "Pendente", "pending");
  world.seed("x1", "Rejeitada", "rejected");
  world.seed("r1", "Respondida", "answered");
  world.seed("a1", "Aprovada", "approved");
  await world.signIn();
  assert.equal(world.votes.countCalls, 1);
});

test("mais votos sem mudar a ordem NÃO regrava o quadro; quando a ordem vira, regrava", async () => {
  const world = setup();
  world.seed("a1", "Primeira", "approved");
  world.seed("b1", "Segunda", "approved");
  world.votes.counts = { a1: 5, b1: 1 };
  await world.signIn();
  assert.equal(world.boards.sets.length, 1);
  world.votes.counts = { a1: 9, b1: 2 };
  await flush(150); // passa alguns ciclos de boardPublishMs
  assert.equal(world.boards.sets.length, 1);
  world.votes.counts = { a1: 9, b1: 20 };
  await flush(150);
  assert.equal(world.boards.sets.length, 2);
  assert.deepEqual(world.lastBoard(), ["Segunda", "Primeira"]);
});

test("rejeitar tira do quadro; reabrir (aprovar de novo) volta", async () => {
  const world = setup();
  world.seed("a1", "Boa", "approved");
  world.seed("b1", "Fora de tom", "approved");
  await world.signIn();
  assert.equal(world.lastBoard().length, 2);
  await world.press("Fora de tom", "rejected");
  assert.deepEqual(world.lastBoard(), ["Boa"]);
  assert.deepEqual(world.sectionTexts("Rejeitadas"), ["Fora de tom"]);
  await world.press("Fora de tom", "approved");
  assert.equal(world.lastBoard().length, 2);
});

test("marcar como respondida sai do quadro e vai pra seção Respondidas; Reabrir traz de volta", async () => {
  const world = setup();
  world.seed("a1", "Já respondi", "approved");
  await world.signIn();
  await world.press("Já respondi", "answered");
  assert.deepEqual(world.sectionTexts("Respondidas"), ["Já respondi"]);
  assert.deepEqual(world.lastBoard(), []);
  await world.press("Já respondi", "approved");
  assert.deepEqual(world.lastBoard(), ["Já respondi"]);
});

test("pergunta nova aprovada por outra tela entra na lista e no quadro sozinha (listener)", async () => {
  const world = setup();
  await world.signIn();
  world.seed("n1", "Chegou depois", "pending");
  await settle();
  assert.deepEqual(world.sectionTexts("Fila"), ["Chegou depois"]);
  await world.questions.update("n1", { status: "approved" });
  await settle();
  assert.deepEqual(world.lastBoard(), ["Chegou depois"]);
});

test("falha ao publicar: avisa na tela e some quando a próxima tentativa dá certo", async () => {
  const world = setup();
  world.seed("a1", "Aprovada", "approved");
  world.boards.failSetWith = denied();
  await world.signIn();
  assert.match(textOf(world.rootEl), /Não consegui atualizar o quadro público/);
  world.boards.failSetWith = null;
  world.votes.counts = { a1: 3 };
  world.seed("b1", "Outra", "approved"); // muda o conjunto: nova tentativa
  await flush(120);
  assert.doesNotMatch(textOf(world.rootEl), /Não consegui atualizar o quadro público/);
  assert.equal(world.lastBoard().length, 2);
});

test("login recusado mostra o motivo e o código; conta sem permissão avisa", async () => {
  const blocked = setup();
  blocked.auth.signInError = Object.assign(new Error("x"), { code: "auth/popup-blocked" });
  await blocked.signIn();
  assert.match(textOf(blocked.rootEl), /bloqueou a janela do Google.*auth\/popup-blocked/);
  assert.match(textOf(blocked.rootEl), /Entrar com Google/);

  const stranger = setup({ signedIn: true });
  stranger.questions.listen = (filters, onNext, onError) => { onError({ code: "permission-denied" }); return () => {}; };
  await settle();
  assert.match(textOf(stranger.rootEl), /Sem permissão/);
});

test("login que já estava feito (tablet recarregado) retoma sozinho e já lista", async () => {
  const world = setup({ signedIn: true });
  world.seed("a1", "Já estava", "approved");
  await settle();
  assert.deepEqual(world.sectionTexts("No ar"), ["Já estava"]);
  assert.equal(world.questions.listenCount(), 1);
});

test("sair para de escutar e volta pra tela de login", async () => {
  const world = setup({ signedIn: true });
  await settle();
  world.rootEl.querySelector("[data-mod-signout]").click();
  await settle();
  assert.equal(world.questions.listenCount(), 0);
  assert.match(textOf(world.rootEl), /Entrar com Google/);
});

test("sem palestra nesta sala mostra o aviso", async () => {
  const world = setup({ signedIn: true, pinned: false, now: () => new Date("2026-11-28T07:00:00Z"), schedule: [FIRST, SECOND] });
  await settle();
  assert.match(textOf(world.rootEl), /Nenhuma palestra nesta sala por enquanto/);
});

test("segue a sala sozinha: quando a próxima palestra começa, passa a moderar e publicar a dela", async () => {
  let clock = new Date("2026-11-28T12:10:00Z");
  const world = setup({ signedIn: true, pinned: false, now: () => clock });
  await settle();
  assert.match(textOf(world.rootEl), /Agentes de IA/);
  clock = new Date("2026-11-28T13:10:00Z");
  await flush(120);
  assert.match(textOf(world.rootEl), /RAG na prática/);
  world.questions.seed({ id: "s1", talkKey: keyOf(SECOND), uid: "u", text: "Da segunda", name: "x", status: "approved" });
  await settle();
  assert.equal(world.boards.sets.at(-1).key, keyOf(SECOND));
});
