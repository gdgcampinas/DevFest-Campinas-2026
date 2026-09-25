/**
 * Testes de TELA do modal de perguntas da plateia (docs/js/features/talk-questions.js + components/talk-questions.js) em
 * jsdom, com repositories falsos: o que a pessoa vê (lista na ordem do quadro, "Votado", limite, avisos) e o que foi gravado.
 *   node --test DevFestIA/tools/dom/talk-questions.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, memoryStorage, flush, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeQuestions, createFakeVotes, createFakeBoards, denied } = require("../lib/fake-question-world.js");

const KEY = "2026-11-28T12:00:00.000Z|ia";
const site = loadSite({
  scripts: [...SITE_BASE, "data/talk-questions.js", "features/question-window.js", "features/question-slots.js", "features/question-ranking.js",
    "components/talk-questions.js", "features/talk-feedback.js", "features/talk-questions.js"],
});
const { window, document } = site;
test.after(() => window.close()); // solta os timers da janela de mentira (senão o processo não termina)
const initTalkQuestions = site.get("initTalkQuestions");
const createSet = site.get("createPersistedSetRepository");
const createValue = site.get("createPersistedValueRepository");
const baseConfig = { ...site.get("TALK_QUESTIONS"), enforceWindow: false, pollMs: 40, mineRefreshMs: 80 };

const slot = { start: new Date("2026-11-28T12:00:00Z"), end: new Date("2026-11-28T12:40:00Z") };
const entry = { key: KEY, slot, data: { title: "Agentes de IA" } };
const board = (...items) => ({ questions: items.map(([id, text, name = "Ana"]) => ({ id, text, name })) });

/** Monta a tela do modal: repositories falsos, armazenamento em memória e o container aberto. */
function setup({ checkedIn = true, config = {}, uid = "me", asked = false, now = () => new Date("2026-11-28T12:10:00Z") } = {}) {
  const questions = createFakeQuestions();
  const votes = createFakeVotes();
  const boards = createFakeBoards();
  const myCheckins = createSet({ storageKey: "checkins", storage: memoryStorage() });
  const myVotes = createSet({ storageKey: "votes", storage: memoryStorage() });
  const myAsked = createSet({ storageKey: "asked", storage: memoryStorage() });
  const myName = createValue({ storageKey: "name", storage: memoryStorage() });
  if (checkedIn) myCheckins.addAll([KEY]);
  if (asked) myAsked.addAll([KEY]);
  document.body.innerHTML = `<div id="host"><div id="slot"></div></div>`;
  const rootEl = document.getElementById("host");
  const { render } = initTalkQuestions(rootEl, {
    index: new Map([[KEY, entry]]),
    config: { ...baseConfig, ...config },
    myCheckins, myVotes, myAsked, myName, now,
    deps: () => ({ questions, votes, boards, getUid: async () => uid }),
  });
  const containerEl = document.getElementById("slot");
  containerEl.getClientRects = () => [{}]; // jsdom não tem layout: diz que o bloco está visível
  return { questions, votes, boards, myVotes, myAsked, myName, rootEl, containerEl, open: async () => { render(containerEl, entry); await settle(); } };
}

const items = containerEl => [...containerEl.querySelectorAll(".question-list > .question-item")].map(textOf);
function fillAndSend(containerEl, { text = "Como testar agentes?", name = "Renato" } = {}) {
  const form = containerEl.querySelector("[data-question-form]");
  form.querySelector("[name=text]").value = text;
  form.querySelector("[name=name]").value = name;
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

test("sem check-in: a lista fica bloqueada e nada é lido do banco", async () => {
  const world = setup({ checkedIn: false });
  await world.open();
  assert.match(textOf(world.containerEl), /check-in/i);
  assert.equal(world.containerEl.querySelector("[data-question-form]"), null);
  assert.equal(world.questions.reads.length, 0);
  assert.equal(world.boards.listenCount(KEY), 0);
});

test("mostra as perguntas do quadro na ordem dele, sem número de votos, com o botão Votar", async () => {
  const world = setup();
  world.boards.emit(KEY, board(["a_k", "Primeira", "Ana"], ["b_k", "Segunda", "Bia"]));
  await world.open();
  const list = items(world.containerEl);
  assert.equal(list.length, 2);
  assert.match(list[0], /Primeira.*Ana.*Votar/);
  assert.match(list[1], /Segunda.*Bia.*Votar/);
  assert.equal(world.containerEl.querySelector(".question-votes"), null);
});

test("quando o quadro muda (a moderação publicou), a lista se redesenha na nova ordem sem reabrir", async () => {
  const world = setup();
  world.boards.emit(KEY, board(["a_k", "Primeira"], ["b_k", "Segunda"]));
  await world.open();
  world.boards.emit(KEY, board(["b_k", "Segunda"], ["a_k", "Primeira"], ["c_k", "Terceira"]));
  assert.deepEqual([...world.containerEl.querySelectorAll(".question-list > .question-item .question-text")].map(textOf), ["Segunda", "Primeira", "Terceira"]);
});

test("com o número de votos no quadro (publishVotes), o número aparece", async () => {
  const world = setup();
  world.boards.emit(KEY, { questions: [{ id: "a_k", text: "Primeira", name: "Ana", votes: 7 }] });
  await world.open();
  assert.equal(textOf(world.containerEl.querySelector(".question-votes")), "7");
});

test("votar grava o voto, vira Votado e o navegador guarda o voto", async () => {
  const world = setup();
  world.boards.emit(KEY, board(["a_k", "Primeira"]));
  await world.open();
  world.containerEl.querySelector("[data-question-vote]").click();
  await settle();
  assert.ok(world.votes.ids.has("me_a_k"));
  assert.match(items(world.containerEl)[0], /Votado/);
  assert.ok(world.myVotes.has("a_k"));
});

test("voto recusado pelo banco (ex.: palestra encerrada) NÃO vira Votado: mostra o aviso", async () => {
  const world = setup();
  world.boards.emit(KEY, board(["a_k", "Primeira"]));
  await world.open();
  world.votes.failAddWith = denied();
  world.containerEl.querySelector("[data-question-vote]").click();
  await settle();
  assert.doesNotMatch(items(world.containerEl)[0], /Votado/);
  assert.match(textOf(world.containerEl), /Não foi possível votar/);
  assert.equal(world.myVotes.has("a_k"), false);
});

test("voto recusado porque a pessoa já votou (o voto existe) vira Votado, sem erro", async () => {
  const world = setup();
  world.boards.emit(KEY, board(["a_k", "Primeira"]));
  world.votes.ids.add("me_a_k"); // votou de outro navegador/aba
  await world.open();
  world.containerEl.querySelector("[data-question-vote]").click();
  await settle();
  assert.match(items(world.containerEl)[0], /Votado/);
  assert.doesNotMatch(textOf(world.containerEl), /Não foi possível votar/);
});

test("enviar pergunta grava pendente no primeiro espaço, mostra em Suas perguntas e lembra o nome", async () => {
  const world = setup();
  await world.open();
  fillAndSend(world.containerEl, { text: "Como testar agentes?", name: "Renato" });
  await settle();
  const saved = world.questions.docs[0];
  assert.equal(saved.id, `me_${KEY}#1`);
  assert.equal(saved.status, "pending");
  assert.equal(saved.talkKey, KEY);
  assert.equal(saved.text, "Como testar agentes?");
  assert.equal(saved.name, "Renato");
  assert.match(textOf(world.containerEl), /Suas perguntas.*Como testar agentes\?.*Aguardando o moderador/);
  assert.equal(world.myName.get(), "Renato");
  assert.ok(world.myAsked.has(KEY));
  assert.match(textOf(world.containerEl), /mais 2 perguntas/);
});

test("pergunta ou nome em branco: avisa e não grava nada", async () => {
  const world = setup();
  await world.open();
  fillAndSend(world.containerEl, { text: "   ", name: "Renato" });
  await settle();
  assert.equal(world.questions.docs.length, 0);
  assert.match(textOf(world.containerEl), /Escreva a pergunta e seu nome/);
});

test("no limite de 3, a 4ª mostra o aviso do máximo e as próprias perguntas, mesmo sem o navegador lembrar que já perguntou", async () => {
  const world = setup({ asked: false });
  ["1", "2", "3"].forEach(slotNumber => world.questions.seed({ id: `me_${KEY}#${slotNumber}`, entryKey: `${KEY}#${slotNumber}`, talkKey: KEY, uid: "me", text: `P${slotNumber}`, name: "Renato" }));
  await world.open(); // não sabe que já perguntou: canAsk aparece
  assert.ok(world.containerEl.querySelector("[data-question-form]"));
  fillAndSend(world.containerEl, { text: "Quarta" });
  await settle();
  assert.equal(world.questions.docs.length, 3);
  assert.match(textOf(world.containerEl), /máximo de 3 perguntas/);
  assert.match(textOf(world.containerEl), /Suas perguntas.*P1.*P2.*P3/);
  assert.equal(world.containerEl.querySelector("[data-question-form]"), null);
});

test("erro do banco ao enviar: mostra o aviso geral e deixa a pessoa tentar de novo", async () => {
  const world = setup();
  await world.open();
  world.questions.failAddWith = Object.assign(new Error("offline"), { code: "unavailable" });
  fillAndSend(world.containerEl);
  await settle();
  assert.match(textOf(world.containerEl), /Não foi possível enviar/);
  assert.equal(world.questions.docs.length, 0);
  fillAndSend(world.containerEl);
  await settle();
  assert.equal(world.questions.docs.length, 1);
});

test("só quem já perguntou nessa palestra relê as próprias perguntas ao abrir", async () => {
  const stranger = setup({ asked: false });
  await stranger.open();
  assert.equal(stranger.questions.reads.length, 0);
  const asker = setup({ asked: true });
  asker.questions.seed({ id: `me_${KEY}#1`, entryKey: `${KEY}#1`, talkKey: KEY, uid: "me", text: "Minha", name: "Renato" });
  await asker.open();
  assert.equal(JSON.stringify(asker.questions.reads), JSON.stringify([{ talkKey: KEY, uid: "me" }])); // (objetos de outra janela: compara como texto)
  assert.match(textOf(asker.containerEl), /Suas perguntas.*Minha/);
});

test("enquanto a pessoa digita, o quadro que chega não apaga o texto; depois de sair do campo, a tela se atualiza", async () => {
  const world = setup();
  world.boards.emit(KEY, board(["a_k", "Primeira"]));
  await world.open();
  const textarea = world.containerEl.querySelector("textarea");
  textarea.focus();
  textarea.value = "Estou escrevendo...";
  world.boards.emit(KEY, board(["z_k", "Chegou agora"], ["a_k", "Primeira"]));
  assert.equal(world.containerEl.querySelector("textarea").value, "Estou escrevendo...");
  assert.doesNotMatch(textOf(world.containerEl), /Chegou agora/);
  textarea.blur();
  await flush(120); // passa um ciclo de pollMs
  assert.match(textOf(world.containerEl), /Chegou agora/);
});

test("com o modal fechado (bloco saiu da tela) para de escutar o quadro", async () => {
  const world = setup();
  await world.open();
  assert.equal(world.boards.listenCount(KEY), 1);
  world.containerEl.remove();
  await flush(120);
  assert.equal(world.boards.listenCount(KEY), 0);
});

test("relê as próprias perguntas enquanto alguma espera o moderador, e para quando deixa de esperar", async () => {
  const world = setup({ asked: true });
  world.questions.seed({ id: `me_${KEY}#1`, entryKey: `${KEY}#1`, talkKey: KEY, uid: "me", text: "Minha", name: "Renato" });
  await world.open();
  assert.match(textOf(world.containerEl), /Aguardando o moderador/);
  await world.questions.update(`me_${KEY}#1`, { status: "approved" });
  await flush(200); // passa mineRefreshMs (80) e um ciclo (40)
  assert.match(textOf(world.containerEl), /Aprovada/);
  const readsAfterApproval = world.questions.reads.length;
  await flush(200);
  assert.equal(world.questions.reads.length, readsAfterApproval); // nada pendente: não relê mais
});

test("trava de horário ligada: antes de a palestra começar mostra o aviso e depois do fim só leitura", async () => {
  const before = setup({ config: { enforceWindow: true }, now: () => new Date("2026-11-28T11:00:00Z") });
  await before.open();
  assert.match(textOf(before.containerEl), /abrem quando a palestra começar/);
  assert.equal(before.containerEl.querySelector("[data-question-form]"), null);

  const after = setup({ config: { enforceWindow: true }, now: () => new Date("2026-11-28T13:00:00Z") });
  after.boards.emit(KEY, board(["a_k", "Primeira"]));
  await after.open();
  assert.match(textOf(after.containerEl), /encerradas/);
  assert.equal(after.containerEl.querySelector("[data-question-vote]"), null);
  assert.match(items(after.containerEl)[0], /Primeira/);
});
