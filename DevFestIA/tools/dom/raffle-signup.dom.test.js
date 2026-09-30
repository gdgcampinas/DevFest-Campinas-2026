/**
 * Testes de TELA do cadastro no sorteio (docs/js/features/raffle-signup.js + components/raffle-signup.js) em
 * jsdom, com o Firebase de mentira em `globals`: as 3 fases (travado/formulário/feito), o check-in por
 * `?checkin=1`, validação e o cadastro duplicado.
 *   node --test DevFestIA/tools/dom/raffle-signup.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, memoryStorage, settle, textOf } = require("../lib/dom-harness.js");
const { denied } = require("../lib/fake-question-world.js");

const SCRIPTS = [...SITE_BASE, "data/raffle-rules.js", "data/raffle-config.js", "components/info-card.js", "components/raffle-signup.js", "features/talk-feedback.js", "features/raffle-signup.js"];

const windows = [];
test.after(() => windows.forEach(window => window.close()));

function setup({ alreadyIn = false, checkedIn = false, url = "http://localhost/", requireTicket = false, registered = [] } = {}) {
  const calls = [];
  const checkinCalls = [];
  const fail = { add: null, checkinAdd: null, hasCheckin: false, lookup: null };
  const site = loadSite({
    scripts: SCRIPTS,
    url,
    globals: {
      firebaseClient: { ensureAnonymousUid: async () => "me" },
      raffleEntriesRepository: {
        async add(uid, entryKey, data) {
          if (fail.add) throw fail.add;
          calls.push({ uid, entryKey, data });
        },
        async addWithId(docId, data) {
          if (fail.add) throw fail.add;
          calls.push({ docId, data });
        },
      },
      raffleCheckinsRepository: {
        async add(uid, entryKey, data) {
          if (fail.checkinAdd) throw fail.checkinAdd;
          checkinCalls.push({ uid, entryKey, data });
        },
        async has() { return fail.hasCheckin; }, // o próprio documento do check-in (a regra deixa a pessoa ler o dela)
      },
    },
  });
  const { document, window } = site;
  windows.push(window);
  const myRaffle = site.get("createPersistedSetRepository")({ storageKey: "raffle", storage: memoryStorage() });
  const myRaffleCheckin = site.get("createPersistedSetRepository")({ storageKey: "raffle-checkin", storage: memoryStorage() });
  if (alreadyIn) myRaffle.addAll(["raffle"]);
  if (checkedIn) myRaffleCheckin.addAll(["raffle"]);
  document.body.innerHTML = `<div id="raffle"></div>`;
  const rootEl = document.getElementById("raffle");
  const lookups = [];
  const registrations = () => ({ async get(key) { lookups.push(key); if (fail.lookup) throw fail.lookup; return registered.includes(key) ? { ticketName: "Grátis" } : null; } });
  const { render } = site.get("initRaffleSignup")(rootEl, { myRaffle, myRaffleCheckin, requireTicket, registrations, toKey: async (edition, email) => `${edition}_${email.toLowerCase()}`, edition: "2026" });
  render(rootEl);
  const fill = (name, value) => { rootEl.querySelector(`[name=${name}]`).value = value; };
  const check = name => { rootEl.querySelector(`[name=${name}]`).checked = true; };
  const submit = () => rootEl.querySelector("[data-raffle-signup-form]").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  return { rootEl, calls, checkinCalls, lookups, fail, myRaffle, myRaffleCheckin, fill, check, submit };
}

test("sem check-in: fica travado, mostra as regras e não tem formulário", () => {
  const world = setup();
  assert.match(textOf(world.rootEl), /Cadastro só durante o evento/);
  assert.match(textOf(world.rootEl), /Só no dia do evento/); // uma das regras
  assert.equal(world.rootEl.querySelector("[data-raffle-signup-form]"), null);
});

test("com check-in local (já escaneou antes): mostra o formulário direto", () => {
  const world = setup({ checkedIn: true });
  assert.ok(world.rootEl.querySelector("[data-raffle-signup-form]"));
});

test("?checkin=1 na URL: faz o check-in, limpa o parâmetro e libera o formulário", async () => {
  const world = setup({ url: "http://localhost/?checkin=1" });
  await settle();
  assert.equal(world.checkinCalls.length, 1);
  assert.equal(world.checkinCalls[0].uid, "me");
  assert.equal(world.checkinCalls[0].entryKey, "raffle");
  assert.ok(world.myRaffleCheckin.has("raffle"));
  assert.ok(world.rootEl.querySelector("[data-raffle-signup-form]"));
  assert.equal(new URL(world.rootEl.ownerDocument.location.href).searchParams.has("checkin"), false);
});

test("?checkin=<código>: manda o código do QR junto com o check-in", async () => {
  const world = setup({ url: "http://localhost/?checkin=ABCD2345" });
  await settle();
  assert.equal(world.checkinCalls[0].data.code, "ABCD2345");
  assert.equal(world.checkinCalls[0].data.entryKey, "raffle");
});

test("check-in recusado mas a pessoa JÁ tinha o check-in (2º QR, ou limpou o navegador): conta como feito, libera o formulário", async () => {
  const world = setup({ url: "http://localhost/?checkin=1" });
  world.fail.checkinAdd = denied();
  world.fail.hasCheckin = true;
  await settle();
  assert.ok(world.myRaffleCheckin.has("raffle"));
  assert.ok(world.rootEl.querySelector("[data-raffle-signup-form]"));
});

test("check-in recusado e sem check-in anterior (QR expirado): fica travado e diz que o QR expirou", async () => {
  const world = setup({ url: "http://localhost/?checkin=VELHO234" });
  world.fail.checkinAdd = denied();
  await settle();
  assert.equal(world.myRaffleCheckin.has("raffle"), false);
  assert.equal(world.rootEl.querySelector("[data-raffle-signup-form]"), null);
  assert.match(textOf(world.rootEl), /Esse QR expirou/);
  assert.match(textOf(world.rootEl), /Escaneie de novo o QR que está no telão/);
});

test("check-in sem internet: fica travado, avisa da conexão, sem quebrar", async () => {
  const world = setup({ url: "http://localhost/?checkin=1" });
  world.fail.checkinAdd = Object.assign(new Error("offline"), { code: "unavailable" });
  await settle();
  assert.equal(world.myRaffleCheckin.has("raffle"), false);
  assert.match(textOf(world.rootEl), /Sem conexão agora/);
});

test("já cadastrado neste navegador: mostra a confirmação direto, sem formulário", () => {
  const world = setup({ alreadyIn: true, checkedIn: true });
  assert.match(textOf(world.rootEl), /Você está participando/);
  assert.equal(world.rootEl.querySelector("[data-raffle-signup-form]"), null);
});

test("nome ou sobrenome em branco: avisa e não grava nada", async () => {
  const world = setup({ checkedIn: true });
  world.fill("firstName", "");
  world.fill("lastName", "Souza");
  world.check("consent");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Preencha nome e sobrenome/);
  assert.equal(world.calls.length, 0);
});

test("sem marcar a autorização: avisa e não grava nada", async () => {
  const world = setup({ checkedIn: true });
  world.fill("firstName", "Ana");
  world.fill("lastName", "Souza");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Marque a autorização/);
  assert.equal(world.calls.length, 0);
});

test("cadastro completo: grava firstName/lastName, lembra localmente e mostra a confirmação", async () => {
  const world = setup({ checkedIn: true });
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
  const world = setup({ checkedIn: true });
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
  const world = setup({ checkedIn: true });
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

// ---------- 1 ingresso = 1 cadastro (requireTicket) ----------
const fillTicketForm = (world, email) => {
  world.fill("firstName", "Ana");
  world.fill("lastName", "Souza");
  if (email !== undefined) world.fill("email", email);
  world.check("consent");
};

test("sem exigir ingresso: não tem campo de e-mail nem a regra do ingresso", () => {
  const world = setup({ checkedIn: true });
  assert.equal(world.rootEl.querySelector("[name=email]"), null);
  assert.doesNotMatch(textOf(world.rootEl), /Um ingresso, um cadastro/);
});

test("exigindo ingresso: aparece o campo de e-mail, a dica e a regra do ingresso", () => {
  const world = setup({ checkedIn: true, requireTicket: true });
  assert.ok(world.rootEl.querySelector("[name=email]"));
  assert.match(textOf(world.rootEl), /Não guardamos o seu e-mail/);
  assert.match(textOf(world.rootEl), /Um ingresso, um cadastro/);
});

test("ingresso: e-mail de quem tem inscrição grava com a chave da inscrição como id (não o uid)", async () => {
  const world = setup({ checkedIn: true, requireTicket: true, registered: ["2026_ana@x.com"] });
  fillTicketForm(world, "Ana@X.com");
  world.submit();
  await settle();
  assert.deepEqual(world.lookups, ["2026_ana@x.com"]);
  assert.equal(world.calls.length, 1);
  assert.equal(world.calls[0].docId, "2026_ana@x.com");
  assert.deepEqual(JSON.parse(JSON.stringify(world.calls[0].data)), { entryKey: "raffle", firstName: "Ana", lastName: "Souza" }, "o e-mail nunca vai pro banco");
  assert.ok(world.myRaffle.has("raffle"));
  assert.match(textOf(world.rootEl), /Você está participando/);
});

test("ingresso: e-mail sem inscrição é recusado na tela, não grava e deixa tentar de novo", async () => {
  const world = setup({ checkedIn: true, requireTicket: true, registered: [] });
  fillTicketForm(world, "intruso@x.com");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Não encontramos inscrição com esse e-mail/);
  assert.equal(world.calls.length, 0);
  assert.equal(world.myRaffle.has("raffle"), false);
  assert.equal(world.rootEl.querySelector("[data-raffle-signup-form] [type=submit]").disabled, false);
});

test("ingresso: e-mail em branco avisa e não consulta nem grava", async () => {
  const world = setup({ checkedIn: true, requireTicket: true });
  fillTicketForm(world, "");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Digite o e-mail do seu ingresso/);
  assert.equal(world.lookups.length, 0);
  assert.equal(world.calls.length, 0);
});

test("ingresso já cadastrado em outro aparelho: o banco recusa e a tela diz que continua participando", async () => {
  const world = setup({ checkedIn: true, requireTicket: true, registered: ["2026_ana@x.com"] });
  world.fail.add = denied();
  fillTicketForm(world, "ana@x.com");
  world.submit();
  await settle();
  assert.ok(world.myRaffle.has("raffle"));
  assert.match(textOf(world.rootEl), /Você está participando/);
  assert.match(textOf(world.rootEl), /Esse ingresso já estava cadastrado/);
});

test("ingresso: falha de rede ao conferir a inscrição avisa e deixa tentar de novo", async () => {
  const world = setup({ checkedIn: true, requireTicket: true });
  world.fail.lookup = Object.assign(new Error("offline"), { code: "unavailable" });
  fillTicketForm(world, "ana@x.com");
  world.submit();
  await settle();
  assert.match(textOf(world.rootEl), /Não foi possível enviar agora/);
  assert.equal(world.calls.length, 0);
  assert.equal(world.myRaffle.has("raffle"), false);
});
