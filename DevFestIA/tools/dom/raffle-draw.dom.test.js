/**
 * Testes de TELA da roleta do sorteio (docs/js/features/raffle-draw.js + components/raffle-wheel.js) em
 * jsdom, repositories de mentira (mesmas de fake-question-world.js, mesmo contrato create-only/listen):
 * login, quem entra no sorteio, modo único x por rodadas, e que a mesma pessoa nunca é sorteada 2x.
 *   node --test DevFestIA/tools/dom/raffle-draw.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeQuestions, denied } = require("../lib/fake-question-world.js");

const SCRIPTS = [...SITE_BASE, "components/moderator-login.js", "components/raffle-wheel.js", "features/moderator-login.js", "features/raffle-draw.js"];

const windows = [];
test.after(() => windows.forEach(window => window.close()));

/** Roleta girando "instantânea" nos testes: sem tique nem espera de 4s, revela na hora. */
const instantSpinTimer = () => ({ run: (onTick, onReveal) => onReveal(), cancel() {} });
const fakeAudioCtx = () => {
  const node = () => ({ connect: () => node(), start() {}, stop() {}, frequency: { value: 0 }, gain: { value: 0, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } });
  return { createOscillator: node, createGain: node, destination: {}, currentTime: 0 };
};

function setup({ signedIn = false, devSeed = [], entries = createFakeQuestions(), draws = createFakeQuestions() } = {}) {
  const site = loadSite({ scripts: SCRIPTS });
  const { document, window } = site;
  windows.push(window);
  const auth = { email: signedIn ? "mod@gdg.dev" : null, signInError: null };
  document.body.innerHTML = `<div id="mod"></div>`;
  const rootEl = document.getElementById("mod");
  site.get("initRaffleDraw")(rootEl, {
    deps: () => ({
      entries, draws,
      signIn: async () => { if (auth.signInError) throw auth.signInError; auth.email = "mod@gdg.dev"; return auth.email; },
      restore: async () => auth.email,
      signOut: async () => { auth.email = null; },
    }),
    devSeed,
    whenReady: task => task(),
    spinTimer: instantSpinTimer(),
    audio: fakeAudioCtx,
    raf: fn => fn(), // roda na hora, sem esperar frame: os testes conferem o ângulo logo depois do giro
  });
  const seedEntry = (id, firstName, lastName) => entries.seed({ id, firstName, lastName });
  const signIn = async () => { rootEl.querySelector("[data-mod-signin]").click(); await settle(); };
  const spin = async () => { rootEl.querySelector("[data-raffle-spin]").click(); await settle(); };
  const setMode = async mode => { rootEl.querySelector(`[data-raffle-mode="${mode}"]`).click(); await settle(); };
  return { rootEl, entries, draws, auth, seedEntry, signIn, spin, setMode };
}

test("sem login: pede a conta de moderador e não lê nada do banco", async () => {
  const world = setup();
  await settle();
  assert.match(textOf(world.rootEl), /Entrar com Google/);
  assert.equal(world.entries.listenCount(), 0);
});

test("logado: mostra quantas pessoas estão na lista", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  assert.match(textOf(world.rootEl), /2 pessoas cadastradas/);
});

test("girar sorteia alguém da lista, grava em raffle-draws com prêmio 1 e mostra o nome", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  await world.signIn();
  await world.spin();
  assert.equal(world.draws.docs.length, 1);
  assert.equal(world.draws.docs[0].entryId, "u1_raffle");
  assert.equal(world.draws.docs[0].prize, 1);
  assert.equal(world.draws.docs[0].name, "Ana Souza");
  assert.match(textOf(world.rootEl), /Ana Souza/);
});

test("girar de verdade roda o disco (transform muda a cada giro, nunca fica parado em 0)", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  await world.spin();
  const firstTransform = world.rootEl.querySelector(".raffle-wheel").style.transform;
  assert.match(firstTransform, /rotate\(\d/);
  assert.notEqual(firstTransform, "rotate(0deg)");
  await world.spin();
  const secondTransform = world.rootEl.querySelector(".raffle-wheel").style.transform;
  assert.notEqual(secondTransform, firstTransform); // cada giro soma ângulo, nunca repete o anterior
});

test("mostra o primeiro nome de cada pessoa na fatia da roda", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  const labels = [...world.rootEl.querySelectorAll(".raffle-wheel-label span")].map(el => el.textContent);
  assert.deepEqual(labels.sort(), ["Ana", "Beto"]);
});

test("depois de revelar o ganhador, a roda continua com as MESMAS fatias do giro (o ponteiro não desalinha)", async () => {
  // Bug real (achado pelo Renato em 2026-10-01): o vencedor saía do pool assim que a gravação chegava, a
  // roda perdia uma fatia no re-render seguinte e o `wheelDeg` (calculado pra arrumação de ANTES) passava a
  // apontar pra outra pessoa. A correção trava as fatias desenhadas (`displayEntries`) até o PRÓXIMO giro.
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  world.seedEntry("u3_raffle", "Carla", "Dias");
  await world.signIn();
  const labelsBefore = [...world.rootEl.querySelectorAll(".raffle-wheel-label span")].map(el => el.textContent).sort();
  await world.spin();
  assert.equal(world.draws.docs.length, 1); // já revelou (spinTimer é síncrono nos testes)
  const labelsAfter = [...world.rootEl.querySelectorAll(".raffle-wheel-label span")].map(el => el.textContent).sort();
  assert.deepEqual(labelsAfter, labelsBefore); // as 3 fatias continuam lá, ninguém sumiu no mesmo instante
});

test("quem já ganhou não entra mais no sorteio nem na lista de 'na lista'", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  await world.spin();
  const firstWinner = world.draws.docs[0].entryId;
  assert.match(textOf(world.rootEl), /1[\s\S]*Na lista/);
  await world.spin();
  assert.equal(world.draws.docs.length, 2);
  assert.notEqual(world.draws.docs[1].entryId, firstWinner);
  assert.equal(world.draws.docs[1].prize, 2);
});

test("modo sorteio único: trava o botão depois do 1º prêmio", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  await world.setMode("single");
  await world.spin();
  assert.equal(world.draws.docs.length, 1);
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, true);
  await world.spin(); // clique não faz nada: já travado
  assert.equal(world.draws.docs.length, 1);
});

test("ninguém cadastrado: o botão de girar fica desabilitado", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, true);
});

test("2 telas de moderador giram ao mesmo tempo: a regra recusa a gravação duplicada e a tela não quebra", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  await world.signIn();
  world.draws.add = async () => { throw denied(); }; // simula a outra tela já tendo sorteado essa pessoa
  await world.spin();
  assert.equal(world.draws.docs.length, 0);
  assert.doesNotMatch(textOf(world.rootEl), /undefined/);
});

test("erro ao carregar a lista: mostra o aviso mas a roleta continua desenhada (não esconde tudo)", async () => {
  const entries = { listen: (filters, onNext, onError) => { onError(new Error("offline")); return () => {}; } };
  const draws = createFakeQuestions();
  const world = setup({ signedIn: true, entries, draws });
  await world.signIn();
  assert.match(textOf(world.rootEl), /Não foi possível carregar a lista agora/);
  assert.ok(world.rootEl.querySelector(".raffle-wheel")); // a roleta (com 0 pessoas) continua na tela
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, true);
});

test("modo DEV sem ninguém cadastrado: gira com a lista de teste (devSeed), sem gravar no Firestore", async () => {
  const devSeed = [{ id: "dev_0", firstName: "Renato", lastName: "Ramos" }, { id: "dev_1", firstName: "Bianca", lastName: "Issa" }];
  const world = setup({ signedIn: true, devSeed });
  await world.signIn();
  assert.match(textOf(world.rootEl), /Modo DEV/);
  await world.spin();
  assert.equal(world.draws.docs.length, 0); // nada foi pro Firestore
  assert.match(textOf(world.rootEl), /Renato Ramos|Bianca Issa/);
});

test("modo DEV: assim que alguém de verdade se cadastra, a lista de teste some e a real assume", async () => {
  const devSeed = [{ id: "dev_0", firstName: "Renato", lastName: "Ramos" }];
  const world = setup({ signedIn: true, devSeed });
  await world.signIn();
  assert.match(textOf(world.rootEl), /Modo DEV/);
  world.seedEntry("u1_raffle", "Ana", "Souza");
  assert.doesNotMatch(textOf(world.rootEl), /Modo DEV/);
  assert.match(textOf(world.rootEl), /1 pessoa cadastrada/);
});

test("mostrar/esconder o QR do sorteio", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  assert.equal(world.rootEl.querySelector("#raffleQr"), null);
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  assert.ok(world.rootEl.querySelector("#raffleQr"));
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  assert.equal(world.rootEl.querySelector("#raffleQr"), null);
});
