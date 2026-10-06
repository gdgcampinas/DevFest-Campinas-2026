/**
 * Testes de TELA do concurso da sessão, lado da plateia (docs/js/features/talk-contest.js + components/talk-contest.js) em jsdom, com
 * repositories falsos (os mesmos mocks das perguntas: projetos = "questions", votos = "votes", pódio = "boards"): o que a pessoa vê em cada
 * fase (sem check-in, antes, aberta, depois), o cadastro do projeto, o voto (um só, nunca no próprio) e a economia de leituras.
 *   node --test DevFestIA/tools/dom/talk-contest.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, memoryStorage, flush, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeQuestions, createFakeVotes, createFakeBoards, denied } = require("../lib/fake-question-world.js");

const KEY = "2026-11-28T12:00:00.000Z|mobile";
const site = loadSite({
  scripts: [...SITE_BASE, "data/talk-questions.js", "data/talk-contest.js", "features/question-window.js", "components/talk-questions.js", "components/talk-highlight.js",
    "components/talk-contest.js", "features/talk-feedback.js", "features/modal-block.js", "features/talk-contest.js"],
});
const { window, document } = site;
test.after(() => window.close()); // solta os timers da janela de mentira (senão o processo não termina)
const initTalkContest = site.get("initTalkContest");
const createSet = site.get("createPersistedSetRepository");
const createValue = site.get("createPersistedValueRepository");
const baseConfig = { ...site.get("TALK_CONTEST"), pollMs: 40, refreshMinMs: 0 };

const slot = { start: new Date("2026-11-28T12:00:00Z"), end: new Date("2026-11-28T12:40:00Z") };
const entry = { key: KEY, slot, data: { title: "GDG Campinas Coding Jam", highlight: "codejam" } };
const OPEN = new Date("2026-11-28T12:10:00Z");
const projectDoc = (uid, project, name) => ({ id: `${uid}_${KEY}`, entryKey: KEY, talkKey: KEY, uid, name, project });

/** Monta o bloco no modal: repositories falsos, armazenamento em memória e o container aberto. */
function setup({ checkedIn = true, uid = "me", now = () => OPEN, enforceWindow = false, config = {} } = {}) {
  const projects = createFakeQuestions();
  const votes = createFakeVotes();
  const results = createFakeBoards();
  const myCheckins = createSet({ storageKey: "checkins", storage: memoryStorage() });
  const myVotes = createSet({ storageKey: "votes", storage: memoryStorage() });
  const myName = createValue({ storageKey: "name", storage: memoryStorage() });
  if (checkedIn) myCheckins.addAll([KEY]);
  document.body.innerHTML = `<div id="host"><div id="slot"></div></div>`;
  const rootEl = document.getElementById("host");
  const ensured = [];
  const { render } = initTalkContest(rootEl, {
    index: new Map([[KEY, entry]]),
    config: { ...baseConfig, ...config }, enforceWindow, myCheckins, myVotes, myName, now,
    ensureCheckin: async checkinEntry => { ensured.push(checkinEntry.key); },
    deps: () => ({ projects, votes, results, getUid: async () => uid }),
  });
  const containerEl = document.getElementById("slot");
  containerEl.getClientRects = () => [{}]; // jsdom não tem layout: diz que o bloco está visível
  return { projects, votes, results, myVotes, myName, rootEl, containerEl, ensured, open: async () => { render(containerEl, entry); await settle(); } };
}

/** Objetos criados dentro do jsdom não passam em deepEqual contra os do Node: compara por JSON. */
function plain(value) { return JSON.parse(JSON.stringify(value)); }

const items = containerEl => [...containerEl.querySelectorAll(".question-list > .question-item")].map(textOf);
function fillAndSend(containerEl, { project = "App de doação", name = "Renato" } = {}) {
  const form = containerEl.querySelector("[data-contest-form]");
  form.querySelector("[name=project]").value = project;
  form.querySelector("[name=name]").value = name;
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}
const voteButtons = containerEl => [...containerEl.querySelectorAll("[data-contest-vote]")];

test("sem check-in: bloqueado, sem formulário e sem ler nada do banco", async () => {
  const world = setup({ checkedIn: false });
  await world.open();
  assert.match(textOf(world.containerEl), /check-in/i);
  assert.equal(world.containerEl.querySelector("[data-contest-form]"), null);
  assert.equal(world.projects.reads.length, 0);
});

test("sessão aberta sem projeto: formulário (nome já preenchido) e a lista vazia; lê a lista uma vez", async () => {
  const world = setup();
  world.myName.set("Renato");
  await world.open();
  assert.ok(world.containerEl.querySelector("[data-contest-form]"));
  assert.equal(world.containerEl.querySelector("[name=name]").value, "Renato");
  assert.match(textOf(world.containerEl), /Nenhum projeto cadastrado ainda/);
  assert.deepEqual(plain(world.projects.reads), [{ talkKey: KEY }]);
});

test("cadastra o próprio projeto: grava com o id <uid>_<sessão>, mostra 'Seu projeto' e some o formulário", async () => {
  const world = setup();
  await world.open();
  fillAndSend(world.containerEl, { project: "App de doação", name: "Renato" });
  await settle();
  assert.deepEqual(plain(world.projects.docs.map(({ id, entryKey, talkKey, uid, name, project }) => ({ id, entryKey, talkKey, uid, name, project }))),
    [{ id: `me_${KEY}`, entryKey: KEY, talkKey: KEY, uid: "me", name: "Renato", project: "App de doação" }]);
  assert.equal(world.containerEl.querySelector("[data-contest-form]"), null, "só dá pra cadastrar um");
  assert.match(textOf(world.containerEl), /Seu projeto/);
  assert.match(textOf(world.containerEl), /App de doação/);
  assert.equal(world.myName.get(), "Renato", "guarda o nome pra próxima vez");
});

test("projeto sem nome ou sem nome da pessoa: avisa e não grava", async () => {
  const world = setup();
  await world.open();
  fillAndSend(world.containerEl, { project: "  ", name: "Renato" });
  await settle();
  assert.match(textOf(world.containerEl), /Escreva o nome do projeto/);
  assert.equal(world.projects.docs.length, 0);
});

test("se o banco recusa por check-in do uid atual ausente, refaz o check-in e tenta de novo", async () => {
  const world = setup();
  await world.open();
  world.projects.failAddWith = denied();
  fillAndSend(world.containerEl);
  await settle();
  assert.deepEqual(world.ensured, [KEY]);
  assert.equal(world.projects.docs.length, 1);
});

test("erro de gravação: mostra o aviso, mantém o formulário e não perde o que foi digitado", async () => {
  const world = setup();
  await world.open();
  world.projects.failAddWith = new Error("offline");
  fillAndSend(world.containerEl, { project: "Meu app" });
  await settle();
  assert.match(textOf(world.containerEl), /Não foi possível cadastrar/);
  assert.ok(world.containerEl.querySelector("[data-contest-form]"));
});

test("projeto que já existia (cadastrado antes): a recusa some e a pessoa o vê como 'Seu projeto'", async () => {
  const world = setup();
  world.projects.seed(projectDoc("me", "App antigo", "Renato"));
  await world.open();
  assert.equal(world.containerEl.querySelector("[data-contest-form]"), null, "já veio na lista");
  assert.match(textOf(world.containerEl), /App antigo/);
});

test("lista de projetos da turma: Votar nos dos outros e o próprio marcado '(você)' sem botão ativo", async () => {
  const world = setup();
  world.projects.seed(projectDoc("ana", "Projeto da Ana", "Ana"));
  world.projects.seed(projectDoc("me", "Meu projeto", "Renato"));
  await world.open();
  const own = [...world.containerEl.querySelectorAll(".question-list .question-item")].find(item => textOf(item).includes("Meu projeto") && textOf(item).includes("(você)"));
  assert.ok(own, "o próprio projeto aparece na lista, marcado");
  const buttons = voteButtons(world.containerEl);
  assert.equal(buttons.length, 2);
  assert.deepEqual(buttons.map(button => button.disabled), [false, true]);
  assert.equal(buttons[0].dataset.contestVote, `ana_${KEY}`);
});

test("votar: grava com o id do check-in (<uid>_<sessão>), marca 'Votado' e trava os outros botões", async () => {
  const world = setup();
  world.projects.seed(projectDoc("ana", "Projeto da Ana", "Ana"));
  world.projects.seed(projectDoc("bia", "Projeto da Bia", "Bia"));
  await world.open();
  voteButtons(world.containerEl)[1].click();
  await settle();
  assert.deepEqual([...world.votes.ids], [`me_${KEY}`], "um voto por check-in");
  assert.ok(world.myVotes.has(`bia_${KEY}`), "este navegador guarda em quem votou");
  const buttons = voteButtons(world.containerEl);
  assert.deepEqual(buttons.map(button => button.disabled), [true, true]);
  assert.equal(buttons[1].getAttribute("aria-pressed"), "true");
  assert.match(textOf(world.containerEl), /Seu voto foi registrado/);
});

test("já votou em outro aparelho: a recusa do banco vira 'voto registrado' e todos os botões travam", async () => {
  const world = setup();
  world.projects.seed(projectDoc("ana", "Projeto da Ana", "Ana"));
  world.votes.ids.add(`me_${KEY}`);
  await world.open();
  voteButtons(world.containerEl)[0].click();
  await settle();
  assert.match(textOf(world.containerEl), /Seu voto foi registrado/);
  assert.ok(voteButtons(world.containerEl).every(button => button.disabled));
  assert.equal(world.myVotes.getAll().length, 0, "não sabe em quem votou, então não marca nenhum");
});

test("erro de rede no voto: avisa e o botão volta a poder ser usado", async () => {
  const world = setup();
  world.projects.seed(projectDoc("ana", "Projeto da Ana", "Ana"));
  await world.open();
  world.votes.failAddWith = new Error("offline");
  voteButtons(world.containerEl)[0].click();
  await settle();
  assert.match(textOf(world.containerEl), /Não foi possível votar/);
  assert.equal(voteButtons(world.containerEl)[0].disabled, false);
});

test("nome e projeto vindos da plateia nunca viram HTML", async () => {
  const world = setup();
  world.projects.seed(projectDoc("ana", "<img src=x onerror=alert(1)>", "<b>Ana</b>"));
  await world.open();
  assert.equal(world.containerEl.querySelector(".question-list img"), null);
  assert.equal(world.containerEl.querySelector(".question-list b"), null);
  assert.match(textOf(world.containerEl), /<img src=x onerror=alert\(1\)>/);
});

test("leituras: a lista é lida uma vez ao abrir e NÃO se atualiza sozinha; só o botão Atualizar relê", async () => {
  const world = setup();
  world.projects.seed(projectDoc("ana", "Projeto da Ana", "Ana"));
  await world.open();
  await flush(200); // vários ciclos de `pollMs`
  assert.equal(world.projects.reads.length, 1);
  world.projects.seed(projectDoc("bia", "Projeto da Bia", "Bia"));
  world.containerEl.querySelector("[data-contest-refresh]").click();
  await settle();
  assert.equal(world.projects.reads.length, 2);
  assert.equal(items(world.containerEl).filter(text => text.includes("Projeto da")).length, 2);
});

test("Atualizar respeita o intervalo mínimo entre leituras", async () => {
  const world = setup({ config: { refreshMinMs: 60000 } });
  await world.open();
  world.containerEl.querySelector("[data-contest-refresh]").click();
  await settle();
  assert.equal(world.projects.reads.length, 1, "não leu de novo");
  assert.match(textOf(world.containerEl), /Aguarde alguns segundos/);
});

test("o aviso de 'aguarde' também aparece para quem já tem projeto (sem formulário na tela)", async () => {
  const world = setup({ config: { refreshMinMs: 60000 } });
  world.projects.seed(projectDoc("me", "App antigo", "Renato"));
  await world.open();
  assert.equal(world.containerEl.querySelector("[data-contest-form]"), null);
  world.containerEl.querySelector("[data-contest-refresh]").click();
  await settle();
  assert.match(textOf(world.containerEl), /Aguarde alguns segundos/);
});

test("trava de horário desligada (DEV): o pódio publicado aparece no modal no lugar da votação", async () => {
  const world = setup({ enforceWindow: false });
  world.projects.seed(projectDoc("ana", "Projeto da Ana", "Ana"));
  world.results.emit(KEY, { podium: [{ place: 1, project: "Projeto da Ana", name: "Ana" }] });
  await world.open();
  assert.match(textOf(world.containerEl.querySelector(".talk-podium-slot")), /1º lugar.*Projeto da Ana/);
  assert.equal(voteButtons(world.containerEl).length, 0, "com o resultado publicado a votação some");
  assert.equal(world.containerEl.querySelector("[data-contest-form]"), null);
});

test("antes de a sessão começar (trava de horário ligada): só o aviso, sem ler nada", async () => {
  const world = setup({ enforceWindow: true, now: () => new Date("2026-11-28T11:00:00Z") });
  await world.open();
  assert.match(textOf(world.containerEl), /abrem quando a sessão começar/);
  assert.equal(world.containerEl.querySelector("[data-contest-form]"), null);
  assert.equal(world.projects.reads.length, 0);
});

test("a sessão abre sozinha: no ciclo seguinte aparece o formulário e a lista é lida uma vez", async () => {
  let clock = new Date("2026-11-28T11:59:00Z");
  const world = setup({ enforceWindow: true, now: () => clock });
  await world.open();
  assert.equal(world.projects.reads.length, 0);
  clock = new Date("2026-11-28T12:01:00Z");
  await flush(120);
  assert.ok(world.containerEl.querySelector("[data-contest-form]"));
  assert.equal(world.projects.reads.length, 1);
});

test("depois da sessão sem pódio publicado: não lê a lista de projetos, avisa e oferece Atualizar", async () => {
  const world = setup({ enforceWindow: true, now: () => new Date("2026-11-28T12:50:00Z") });
  await world.open();
  assert.equal(world.projects.reads.length, 0, "nem lista nem votação depois do fim");
  assert.equal(world.containerEl.querySelector("[data-contest-form]"), null);
  assert.equal(voteButtons(world.containerEl).length, 0);
  assert.match(textOf(world.containerEl), /pódio aparece aqui quando a organização publicar/);
  world.results.emit(KEY, { podium: [{ place: 1, project: "App da Ana", name: "Ana" }] });
  world.containerEl.querySelector("[data-contest-refresh]").click();
  await settle();
  assert.match(textOf(world.containerEl), /App da Ana/);
});

test("depois da sessão com pódio publicado: mostra 1º, 2º e 3º com projeto e pessoa", async () => {
  const world = setup({ enforceWindow: true, now: () => new Date("2026-11-28T12:50:00Z") });
  world.results.emit(KEY, { podium: [{ place: 1, project: "App da Ana", name: "Ana" }, { place: 2, project: "<b>Jogo</b>", name: "Bia" }] });
  await world.open();
  const slots = [...world.containerEl.querySelectorAll(".talk-podium-slot")].map(textOf);
  assert.equal(slots.length, 3, "os lugares vêm do destaque");
  assert.match(slots[0], /1º lugar.*App da Ana.*Ana/);
  assert.match(slots[1], /2º lugar.*<b>Jogo<\/b>.*Bia/, "o texto vindo do banco é escapado");
  assert.equal(world.containerEl.querySelector(".talk-podium b b"), null);
  assert.ok(!slots[2].includes("undefined"));
});
