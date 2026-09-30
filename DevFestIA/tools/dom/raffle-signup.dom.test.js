/**
 * Testes de TELA do cadastro no sorteio (docs/js/features/raffle-signup.js + components/raffle-signup.js) em
 * jsdom, com o Firebase de mentira em `globals`: fases (formulário/feito), validação e o cadastro duplicado.
 *   node --test DevFestIA/tools/dom/raffle-signup.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, memoryStorage, settle, textOf } = require("../lib/dom-harness.js");
const { denied } = require("../lib/fake-question-world.js");

const SCRIPTS = [...SITE_BASE, "components/raffle-signup.js", "features/talk-feedback.js", "features/raffle-signup.js"];

const windows = [];
test.after(() => windows.forEach(window => window.close()));

function setup({ alreadyIn = false } = {}) {
  const calls = [];
  const fail = { add: null };
  const site = loadSite({
    scripts: SCRIPTS,
    globals: {
      firebaseClient: { ensureAnonymousUid: async () => "me" },
      raffleEntriesRepository: {
        async add(uid, entryKey, data) {
          if (fail.add) throw fail.add;
          calls.push({ uid, entryKey, data });
        },
      },
    },
  });
  const { document, window } = site;
  windows.push(window);
  const myRaffle = site.get("createPersistedSetRepository")({ storageKey: "raffle", storage: memoryStorage() });
  if (alreadyIn) myRaffle.addAll(["raffle"]);
  document.body.innerHTML = `<div id="raffle"></div>`;
  const rootEl = document.getElementById("raffle");
  const { render } = site.get("initRaffleSignup")(rootEl, { myRaffle });
  render(rootEl);
  const fill = (name, value) => { rootEl.querySelector(`[name=${name}]`).value = value; };
  const check = name => { rootEl.querySelector(`[name=${name}]`).checked = true; };
  const submit = () => rootEl.querySelector("[data-raffle-signup-form]").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  return { rootEl, calls, fail, myRaffle, fill, check, submit };
}

test("mostra o formulário quando ainda não cadastrou", () => {
  const world = setup();
  assert.match(textOf(world.rootEl), /Cadastre seu nome/);
  assert.equal(world.myRaffle.has("raffle"), false);
});

test("já cadastrado neste navegador: mostra a confirmação direto, sem formulário", () => {
  const world = setup({ alreadyIn: true });
  assert.match(textOf(world.rootEl), /Você está participando/);
  assert.equal(world.rootEl.querySelector("[data-raffle-signup-form]"), null);
});

test("nome ou sobrenome em branco: avisa e não grava nada", async () => {
  const world = setup();
  world.fill("firstName", "");
  world.fill("lastName", "Souza");
  world.check("consent");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Preencha nome e sobrenome/);
  assert.equal(world.calls.length, 0);
});

test("sem marcar a autorização: avisa e não grava nada", async () => {
  const world = setup();
  world.fill("firstName", "Ana");
  world.fill("lastName", "Souza");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Marque a autorização/);
  assert.equal(world.calls.length, 0);
});

test("cadastro completo: grava firstName/lastName, lembra localmente e mostra a confirmação", async () => {
  const world = setup();
  world.fill("firstName", "Ana");
  world.fill("lastName", "Souza");
  world.check("consent");
  world.submit();
  await settle();
  assert.equal(world.calls.length, 1);
  assert.equal(world.calls[0].uid, "me");
  assert.equal(world.calls[0].entryKey, "raffle");
  assert.equal(world.calls[0].data.entryKey, "raffle");
  assert.equal(world.calls[0].data.firstName, "Ana");
  assert.equal(world.calls[0].data.lastName, "Souza");
  assert.ok(world.myRaffle.has("raffle"));
  assert.match(textOf(world.rootEl), /Você está participando/);
});

test("banco recusa por já existir (2ª aba): conta como cadastrado, sem mostrar erro", async () => {
  const world = setup();
  world.fail.add = denied();
  world.fill("firstName", "Ana");
  world.fill("lastName", "Souza");
  world.check("consent");
  world.submit();
  await settle();
  assert.ok(world.myRaffle.has("raffle"));
  assert.match(textOf(world.rootEl), /Você está participando/);
});

test("erro de rede: avisa e deixa tentar de novo", async () => {
  const world = setup();
  world.fail.add = Object.assign(new Error("offline"), { code: "unavailable" });
  world.fill("firstName", "Ana");
  world.fill("lastName", "Souza");
  world.check("consent");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Não foi possível enviar agora/);
  assert.equal(world.myRaffle.has("raffle"), false);
  assert.equal(world.rootEl.querySelector("[type=submit]").disabled, false);
});
