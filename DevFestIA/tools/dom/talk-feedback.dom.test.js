/**
 * Testes de TELA do check-in e da avaliação da palestra (docs/js/features/talk-feedback.js + components) e da avaliação do evento
 * (features/event-feedback.js) em jsdom, com o Firebase de mentira em `window`: fases, confirmação inline, envio, erros e o check-in por QR.
 *   node --test DevFestIA/tools/dom/talk-feedback.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, memoryStorage, settle, textOf } = require("../lib/dom-harness.js");
const { denied } = require("../lib/fake-question-world.js");

const KEY = "2026-11-28T12:00:00.000Z|ia";
const SCRIPTS = [...SITE_BASE, "data/event-feedback-form.js", "components/rating-inputs.js", "components/talk-feedback.js", "components/event-feedback.js",
  "features/talk-feedback.js", "features/event-feedback.js"];

const windows = [];
test.after(() => windows.forEach(window => window.close())); // solta os timers das janelas de mentira (senão o processo não termina)

/** Uma página nova por teste (o QR de check-in lê a URL ao iniciar), com o Firebase de mentira. */
function setup({ url = "http://localhost/?lineup=1", now = new Date("2026-11-28T12:10:00Z") } = {}) {
  const calls = { checkins: [], ratings: [], events: [] };
  const fail = { checkin: null, rating: null, event: null };
  const respond = (kind, list) => async (uid, key, data) => { if (fail[kind]) throw fail[kind]; list.push({ uid, key, data }); };
  const site = loadSite({
    scripts: SCRIPTS, url,
    globals: {
      firebaseClient: { ensureAnonymousUid: async () => "me" },
      checkinRepository: { add: respond("checkin", calls.checkins) },
      feedbackRepository: { add: respond("rating", calls.ratings) },
      eventFeedbackRepository: { add: respond("event", calls.events) },
    },
  });
  const { document, window } = site;
  windows.push(window);
  const createSet = site.get("createPersistedSetRepository");
  const myCheckins = createSet({ storageKey: "c", storage: memoryStorage() });
  const myRatings = createSet({ storageKey: "r", storage: memoryStorage() });
  const myName = site.get("createPersistedValueRepository")({ storageKey: "n", storage: memoryStorage() });
  const slot = { start: new Date("2026-11-28T12:00:00Z"), end: new Date("2026-11-28T12:40:00Z") };
  const entry = { key: KEY, code: "0900.ia", slot, data: { title: "Agentes de IA" } };
  const index = { get: key => (key === KEY ? entry : undefined), getByCode: code => (code === "0900.ia" ? entry : undefined) };
  document.body.innerHTML = `<div id="fb"></div><div id="ev"></div>`;
  const rootEl = document.body;
  const clock = { now };
  const feedback = site.get("initTalkFeedback")(rootEl, { index, now: () => clock.now, myCheckins, myRatings, myName });
  const eventFeedback = site.get("initEventFeedback")(rootEl, { form: site.get("eventFeedbackFormRepository").getAll(), myRatings, myName, now: () => clock.now, endsAt: new Date("2026-11-28T18:00:00Z") });
  return { site, window, document, calls, fail, myCheckins, myRatings, myName, feedback, eventFeedback, clock, entry, fb: document.getElementById("fb"), ev: document.getElementById("ev"),
    submit: form => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })) };
}

// ---------- check-in e avaliação da palestra ----------
test("sem check-in: mostra o botão; pede confirmação inline e só grava ao confirmar", async () => {
  const world = setup();
  world.feedback.render(world.fb, world.entry);
  assert.match(textOf(world.fb), /Check-in dessa palestra/);
  world.fb.querySelector("[data-feedback-checkin]").click();
  assert.match(textOf(world.fb), /Confirma o check-in em .*Agentes de IA/);
  assert.equal(world.calls.checkins.length, 0);
  world.fb.querySelector("[data-feedback-checkin-confirm]").click();
  await settle();
  assert.deepEqual(world.calls.checkins.map(call => [call.uid, call.key]), [["me", KEY]]);
  assert.ok(world.myCheckins.has(KEY));
  assert.match(textOf(world.fb), /Check-in feito. A avaliação libera quando a palestra terminar/);
});

test("cancelar a confirmação volta pro botão sem gravar", async () => {
  const world = setup();
  world.feedback.render(world.fb, world.entry);
  world.fb.querySelector("[data-feedback-checkin]").click();
  world.fb.querySelector("[data-feedback-checkin-cancel]").click();
  assert.ok(world.fb.querySelector("[data-feedback-checkin]"));
  assert.equal(world.calls.checkins.length, 0);
});

test("check-in sem internet: avisa e não marca como feito", async () => {
  const world = setup();
  world.fail.checkin = Object.assign(new Error("offline"), { code: "unavailable" });
  world.feedback.render(world.fb, world.entry);
  world.fb.querySelector("[data-feedback-checkin]").click();
  world.fb.querySelector("[data-feedback-checkin-confirm]").click();
  await settle();
  assert.match(textOf(world.fb), /Sem conexão agora/);
  assert.equal(world.myCheckins.has(KEY), false);
});

test("check-in que o banco recusa por já existir conta como feito", async () => {
  const world = setup();
  world.fail.checkin = denied();
  world.feedback.render(world.fb, world.entry);
  world.fb.querySelector("[data-feedback-checkin]").click();
  world.fb.querySelector("[data-feedback-checkin-confirm]").click();
  await settle();
  assert.ok(world.myCheckins.has(KEY));
});

test("palestra terminada com check-in: formulário com a nota 5 já marcada; exige o nome", async () => {
  const world = setup({ now: new Date("2026-11-28T13:00:00Z") });
  world.myCheckins.addAll([KEY]);
  world.feedback.render(world.fb, world.entry);
  const form = world.fb.querySelector("[data-feedback-form]");
  assert.equal(form.querySelector("input[type=radio]:checked").value, "5");
  world.submit(form);
  await settle();
  assert.match(textOf(world.fb), /Informe seu nome/);
  assert.equal(world.calls.ratings.length, 0);
});

test("enviar avaliação grava nota, nome e só os textos preenchidos, e mostra o agradecimento", async () => {
  const world = setup({ now: new Date("2026-11-28T13:00:00Z") });
  world.myCheckins.addAll([KEY]);
  world.feedback.render(world.fb, world.entry);
  const form = world.fb.querySelector("[data-feedback-form]");
  form.querySelector(`input[name="rating-${KEY}"][value="3"]`).checked = true;
  form.querySelector("[name=name]").value = "Renato";
  form.querySelector("[name=highlight]").value = "Exemplos reais";
  world.submit(form);
  await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(world.calls.ratings[0])), { uid: "me", key: KEY, data: { entryKey: KEY, rating: 3, name: "Renato", highlight: "Exemplos reais" } });
  assert.ok(world.myRatings.has(KEY));
  assert.equal(world.myName.get(), "Renato");
  assert.match(textOf(world.fb), /Obrigado pela avaliação/);
});

test("erro ao enviar a avaliação: avisa e deixa tentar de novo", async () => {
  const world = setup({ now: new Date("2026-11-28T13:00:00Z") });
  world.myCheckins.addAll([KEY]);
  world.feedback.render(world.fb, world.entry);
  world.fail.rating = Object.assign(new Error("offline"), { code: "unavailable" });
  const form = world.fb.querySelector("[data-feedback-form]");
  form.querySelector("[name=name]").value = "Renato";
  world.submit(form);
  await settle();
  assert.match(textOf(world.fb), /Não foi possível enviar agora/);
  assert.equal(world.fb.querySelector("[type=submit]").disabled, false);
  assert.equal(world.myRatings.has(KEY), false);
});

test("já avaliou: mostra o agradecimento, sem formulário", async () => {
  const world = setup({ now: new Date("2026-11-28T13:00:00Z") });
  world.myCheckins.addAll([KEY]);
  world.myRatings.addAll([KEY]);
  world.feedback.render(world.fb, world.entry);
  assert.equal(world.fb.querySelector("form"), null);
  assert.match(textOf(world.fb), /Obrigado pela avaliação/);
});

// ---------- check-in por QR (?checkin=) ----------
test("QR de check-in: grava, tira o parâmetro da URL e pede pra abrir a palestra", async () => {
  const world = setup({ url: "http://localhost/?lineup=1&checkin=0900.ia" });
  const opened = [];
  world.document.body.addEventListener("devfest:open-talk", event => opened.push({ key: event.detail.key, message: event.detail.message }));
  await settle();
  assert.deepEqual(world.calls.checkins.map(call => call.key), [KEY]);
  assert.ok(world.myCheckins.has(KEY));
  assert.doesNotMatch(world.window.location.search, /checkin=/);
  assert.deepEqual(opened, [{ key: KEY, message: "" }]);
});

test("QR de check-in sem internet: abre a palestra mesmo assim, com o aviso (e nada marcado como feito)", async () => {
  const failing = loadSiteWithFailingCheckin(); // a falha precisa valer já na leitura do QR, que roda ao iniciar
  await settle();
  assert.deepEqual(failing.opened.map(item => item.key), [KEY]);
  assert.match(failing.opened[0].message, /Sem conexão agora/);
  assert.equal(failing.myCheckins.has(KEY), false);
});

function loadSiteWithFailingCheckin() {
  const site = loadSite({
    scripts: SCRIPTS, url: "http://localhost/?checkin=0900.ia",
    globals: { firebaseClient: { ensureAnonymousUid: async () => "me" }, checkinRepository: { add: async () => { throw Object.assign(new Error("offline"), { code: "unavailable" }); } } },
  });
  windows.push(site.window);
  const myCheckins = site.get("createPersistedSetRepository")({ storageKey: "c", storage: memoryStorage() });
  const entry = { key: KEY, code: "0900.ia", slot: { start: new Date(), end: new Date() }, data: { title: "x" } };
  const opened = [];
  site.document.body.addEventListener("devfest:open-talk", event => opened.push({ key: event.detail.key, message: event.detail.message }));
  site.get("initTalkFeedback")(site.document.body, { index: { get: () => entry, getByCode: () => entry }, myCheckins, myRatings: myCheckins, myName: site.get("createPersistedValueRepository")({ storageKey: "n", storage: memoryStorage() }) });
  return { opened, myCheckins };
}

test("QR de código desconhecido só limpa o parâmetro, sem gravar nem abrir nada", async () => {
  const world = setup({ url: "http://localhost/?checkin=9999.zz" });
  const opened = [];
  world.document.body.addEventListener("devfest:open-talk", event => opened.push(event));
  await settle();
  assert.equal(world.calls.checkins.length, 0);
  assert.equal(opened.length, 0);
  assert.doesNotMatch(world.window.location.search, /checkin=/);
});

// ---------- avaliação do evento ----------
const fillEvent = (form, { nps = "9", name = "Renato" } = {}) => {
  form.querySelectorAll("input[name^=aspect-]").forEach(input => { if (input.value === "4") input.checked = true; });
  if (nps !== null) form.querySelector(`input[name="event-nps"][value="${nps}"]`).checked = true;
  form.querySelector("[name=name]").value = name;
};

test("avaliação do evento antes do fim: só avisa que abre depois", () => {
  const world = setup({ now: new Date("2026-11-28T15:00:00Z") });
  world.eventFeedback.render(world.ev);
  assert.match(textOf(world.ev), /abre quando o DevFest terminar/);
  assert.equal(world.ev.querySelector("form"), null);
});

test("avaliação do evento depois do fim: formulário com os 6 aspectos e a escala 0-10", () => {
  const world = setup({ now: new Date("2026-11-28T19:00:00Z") });
  world.eventFeedback.render(world.ev);
  assert.equal(world.ev.querySelectorAll(".aspect-row").length, 6);
  assert.equal(world.ev.querySelectorAll("input[name=event-nps]").length, 11);
});

test("sem escolher a indicação de 0 a 10 ou sem nome: avisa e não grava", async () => {
  const world = setup({ now: new Date("2026-11-28T19:00:00Z") });
  world.eventFeedback.render(world.ev);
  const form = world.ev.querySelector("form");
  fillEvent(form, { nps: null });
  world.submit(form);
  await settle();
  assert.match(textOf(world.ev), /Escolha uma nota de 0 a 10/);
  fillEvent(world.ev.querySelector("form"), { name: "" });
  world.ev.querySelector(`input[name="event-nps"][value="7"]`).checked = true;
  world.submit(world.ev.querySelector("form"));
  await settle();
  assert.match(textOf(world.ev), /Informe seu nome/);
  assert.equal(world.calls.events.length, 0);
});

test("enviar a avaliação do evento grava tudo com a chave fixa, avisa o resto do site e mostra o agradecimento", async () => {
  const world = setup({ now: new Date("2026-11-28T19:00:00Z") });
  world.eventFeedback.render(world.ev);
  let changed = 0;
  world.document.body.addEventListener("devfest:feedback-changed", () => changed++);
  const form = world.ev.querySelector("form");
  fillEvent(form, { nps: "10" });
  world.submit(form);
  await settle();
  const saved = JSON.parse(JSON.stringify(world.calls.events[0]));
  assert.equal(saved.key, "event-end");
  assert.equal(saved.data.entryKey, "event-end");
  assert.equal(saved.data.nps, 10);
  assert.equal(saved.data.rating, 5);
  assert.equal(saved.data.name, "Renato");
  assert.deepEqual(Object.keys(saved.data.aspects).sort(), ["alimentacao", "comunicacao", "conteudo", "local", "networking", "organizacao"]);
  assert.ok(Object.values(saved.data.aspects).every(value => value === 4));
  assert.ok(world.myRatings.has("event-end"));
  assert.equal(changed, 1);
  assert.match(textOf(world.ev), /Obrigado pela avaliação/);
});

test("erro ao enviar a avaliação do evento: avisa e não marca como enviada", async () => {
  const world = setup({ now: new Date("2026-11-28T19:00:00Z") });
  world.eventFeedback.render(world.ev);
  world.fail.event = Object.assign(new Error("offline"), { code: "unavailable" });
  const form = world.ev.querySelector("form");
  fillEvent(form);
  world.submit(form);
  await settle();
  assert.match(textOf(world.ev), /Não foi possível enviar agora/);
  assert.equal(world.myRatings.has("event-end"), false);
});

test("já avaliou o evento: só o agradecimento", () => {
  const world = setup({ now: new Date("2026-11-28T19:00:00Z") });
  world.myRatings.addAll(["event-end"]);
  world.eventFeedback.render(world.ev);
  assert.equal(world.ev.querySelector("form"), null);
  assert.match(textOf(world.ev), /Obrigado pela avaliação/);
});
