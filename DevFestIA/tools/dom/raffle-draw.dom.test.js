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

const SCRIPTS = [...SITE_BASE, "components/moderator-login.js", "features/raffle-pool.js", "features/raffle-session.js", "features/confetti-engine.js", "features/confetti.js", "data/raffle-confetti.js", "data/raffle-sound.js", "features/raffle-sound.js", "features/raffle-rounds.js", "data/raffle-config.js", "components/raffle-arrivals.js", "components/raffle-wheel.js", "features/moderator-login.js", "features/raffle-draw.js"];

const windows = [];
test.after(() => windows.forEach(window => window.close()));

/** Roleta girando "instantânea" nos testes: sem tique nem espera de 4s, revela na hora. */
const instantSpinTimer = () => ({ run: (onTick, onReveal) => onReveal(), cancel() {} });
/** AudioContext de mentira: conta quantas notas (osciladores) foram tocadas e quantas vezes o contexto foi criado. */
const audioLog = { contexts: 0, oscillators: 0 };
const fakeAudioCtx = () => {
  audioLog.contexts++;
  const node = () => ({ connect: () => node(), start() {}, stop() {}, frequency: { value: 0 }, gain: { value: 0, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } });
  return { createOscillator: () => { audioLog.oscillators++; return node(); }, createGain: node, destination: {}, currentTime: 0 };
};

/** Modo telão sem tela cheia de verdade (jsdom não tem a API): só registra as chamadas. */
const fakeFullscreen = () => {
  const calls = { enter: 0, exit: 0 };
  let active = false;
  return { calls, enter: () => { calls.enter++; active = true; }, exit: () => { calls.exit++; active = false; }, isActive: () => active, setActive: value => { active = value; } };
};

/** Rodada atual do sorteio (raffle-state/current) de mentira: `set` grava e avisa quem escuta; `emit` simula outra tela. */
const fakeState = (initialRound = null) => {
  const listeners = new Set();
  const world = {
    doc: initialRound ? { round: initialRound } : null,
    sets: [],
    fail: false,
    errorOnListen: false,
    listen(id, onNext, onError) {
      if (world.errorOnListen) { onError(new Error("offline")); return () => {}; }
      listeners.add(onNext);
      onNext(world.doc);
      return () => listeners.delete(onNext);
    },
    async set(id, data) {
      if (world.fail) throw new Error("offline");
      world.sets.push({ id, ...data });
      world.emit({ round: data.round });
    },
    emit(doc) { world.doc = doc; listeners.forEach(listener => listener(doc)); },
  };
  return world;
};

/** Repository de mentira do código do QR: guarda as gravações e deixa simular falha. */
const fakeSession = () => {
  const world = { writes: [], fail: false, async set(id, data) { if (world.fail) throw new Error("offline"); world.writes.push({ id, ...data }); } };
  return world;
};

function setup({ signedIn = false, devSeed = [], entries = createFakeQuestions(), draws = createFakeQuestions(), startInTelao = false, random, initialRound = null } = {}) {
  const site = loadSite({ scripts: SCRIPTS });
  const { document, window } = site;
  windows.push(window);
  const auth = { email: signedIn ? "mod@gdg.dev" : null, signInError: null };
  document.body.innerHTML = `<div id="mod"></div>`;
  const rootEl = document.getElementById("mod");
  const fullscreen = fakeFullscreen();
  const session = fakeSession();
  const state = fakeState(initialRound);
  const qrDraws = []; // o que foi desenhado no QR (texto e tamanho)
  const confettiFires = []; // cada disparo do papel picado ({ origin, force })
  const ticks = []; // virada do código: só roda quando o teste manda (`rotateCode`)
  let codeNumber = 0;
  const scheduled = []; // tempo de exibição do ganhador: só roda quando o teste manda (`releaseReveal`)
  site.get("initRaffleDraw")(rootEl, {
    deps: () => ({
      entries, draws, session, state,
      signIn: async () => { if (auth.signInError) throw auth.signInError; auth.email = "mod@gdg.dev"; return auth.email; },
      restore: async () => auth.email,
      signOut: async () => { auth.email = null; },
    }),
    devSeed,
    whenReady: task => task(),
    spinTimer: instantSpinTimer(),
    audio: fakeAudioCtx,
    schedule: fn => scheduled.push(fn),
    drawQrCode: (el, text, size) => { if (el) qrDraws.push({ text, size }); },
    confetti: { fire: options => { confettiFires.push(options); return true; } },
    every: fn => { ticks.push(fn); return () => ticks.splice(ticks.indexOf(fn), 1); },
    generateCode: () => `CODIGO${++codeNumber}`.padEnd(8, "X"),
    fullscreen,
    startInTelao,
    ...(random ? { random } : {}),
  });
  const seedEntry = (id, firstName, lastName) => entries.seed({ id, firstName, lastName });
  const releaseReveal = async () => { scheduled.splice(0).forEach(fn => fn()); await settle(); };
  const rotateCode = async () => { ticks.slice().forEach(fn => fn()); await settle(); };
  const signIn = async () => { rootEl.querySelector("[data-mod-signin]").click(); await settle(); };
  const spin = async () => { rootEl.querySelector("[data-raffle-spin]").click(); await settle(); };
  return { rootEl, document, window, entries, draws, auth, seedEntry, signIn, spin, fullscreen, releaseReveal, session, ticks, rotateCode, qrDraws, confettiFires, state };
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

test("mostra nome e último sobrenome de cada pessoa na fatia da roda", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  const labels = [...world.rootEl.querySelectorAll(".raffle-wheel-label span")].map(el => el.textContent);
  assert.deepEqual(labels.sort(), ["Ana Souza", "Beto Lima"]);
});

test("o nome de cada fatia fica no centro da cor dela (rótulo parte das 12h, igual ao conic-gradient)", async () => {
  // Bug real (2026-10-01): a linha do rótulo aponta pras 3h com rotate(0) e o conic-gradient começa às 12h;
  // sem tirar 90° os nomes ficavam deslocados da própria fatia e o ganhador anunciado nunca estava sob a seta.
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  const rotations = [...world.rootEl.querySelectorAll(".raffle-wheel-label")].map(el => parseFloat(el.style.transform.match(/rotate\(([-\d.]+)deg\)/)[1]));
  // 2 fatias de 180°: centros em 90° e 270° (a partir das 12h) => rotações 0° e 180° (a partir das 3h)
  assert.deepEqual(rotations, [0, 180]);
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

test("não existe mais o modo sorteio único: só por rodadas, o botão segue livre depois de um prêmio", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Beto", "Lima");
  await world.signIn();
  assert.equal(world.rootEl.querySelector("[data-raffle-mode]"), null);
  await world.spin();
  assert.equal(world.draws.docs.length, 1);
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, false);
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
  world.draws.addWithId = async () => { throw denied(); }; // simula a outra tela já tendo sorteado essa pessoa
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

test("erro ao carregar (regras do Firestore ainda não publicadas) não trava a roda vazia em modo DEV", async () => {
  // Bug real (achado pelo Renato em 2026-10-01): o `refreshDisplayWhenIdle()` só era chamado no callback de
  // SUCESSO do listener — contra o Firestore real sem as regras do sorteio publicadas ainda, só o de ERRO
  // roda, `displayEntries` nunca era preenchido e a roda ficava azul, uma fatia só, mesmo com a lista de
  // teste do Time pronta (`poolCount` mostrava 22, mas a roda desenhava 0).
  const entries = { listen: (filters, onNext, onError) => { onError({ code: "permission-denied" }); return () => {}; } };
  const draws = { listen: (filters, onNext, onError) => { onError({ code: "permission-denied" }); return () => {}; } };
  const devSeed = [{ id: "dev_0", firstName: "Renato", lastName: "Ramos" }, { id: "dev_1", firstName: "Bianca", lastName: "Issa" }];
  const world = setup({ signedIn: true, entries, draws, devSeed });
  await world.signIn();
  assert.match(textOf(world.rootEl), /Não foi possível carregar a lista agora/);
  assert.equal(world.rootEl.querySelectorAll(".raffle-wheel-label").length, 2); // as 2 fatias do devSeed aparecem mesmo com erro
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, false);
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

const labelsOf = rootEl => [...rootEl.querySelectorAll(".raffle-wheel-label span")].map(el => el.textContent);
const manyEntries = (world, count) => { for (let i = 1; i <= count; i++) world.seedEntry(`u${i}_raffle`, `P${i}`, `S${i}`); };

test("roda com muita gente: mostra só uma amostra (as mais recentes) e o contador traz o total", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 100);
  await world.signIn();
  const labels = labelsOf(world.rootEl);
  assert.equal(labels.length, 24);
  assert.ok(labels.includes("P100 S100") && !labels.includes("P1 S1"), "parada, a roda mostra quem chegou por último");
  assert.equal(world.rootEl.querySelector(".raffle-counter-value").textContent, "100");
});

test("giro com muita gente: o ganhador sai da lista inteira e está numa das 24 fatias", async () => {
  const world = setup({ signedIn: true, random: () => 0.5 });
  manyEntries(world, 100);
  await world.signIn();
  await world.spin();
  assert.equal(world.draws.docs.length, 1);
  const winnerLabel = world.draws.docs[0].name.split(" ");
  assert.ok(labelsOf(world.rootEl).includes(`${winnerLabel[0]} ${winnerLabel.at(-1)}`), "o sorteado está na roda");
  assert.equal(labelsOf(world.rootEl).length, 24);
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /99\s*Na lista/);
});

test("contador ao vivo e faixa de chegadas: o mais recente primeiro, só o recém-chegado ganha a animação", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  assert.deepEqual([...world.rootEl.querySelectorAll(".raffle-arrival")].map(el => el.textContent), ["P3 S3", "P2 S2", "P1 S1"]);
  assert.equal(world.rootEl.querySelectorAll(".raffle-arrival.is-new").length, 0, "quem já estava lá não anima");
  world.seedEntry("u4_raffle", "Maria", "Silva");
  await settle();
  assert.equal(world.rootEl.querySelector(".raffle-counter-value").textContent, "4");
  const first = world.rootEl.querySelector(".raffle-arrival");
  assert.equal(first.textContent, "Maria Silva");
  assert.ok(first.classList.contains("is-new"));
  assert.equal(world.rootEl.querySelectorAll(".raffle-arrival.is-new").length, 1);
});

test("ganhador recém-revelado: a roda não muda até acabar o tempo, depois se renova sem ele", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  assert.equal(labelsOf(world.rootEl).length, 3, "durante o tempo do ganhador a roda segue igual");
  world.seedEntry("u4_raffle", "Nova", "Pessoa");
  await settle();
  assert.equal(labelsOf(world.rootEl).length, 3, "gente nova não mexe na roda enquanto o ganhador está sob o ponteiro");
  assert.ok(world.rootEl.querySelector(".raffle-winner"), "o cartão do ganhador fica enquanto a roda está parada");
  await world.releaseReveal();
  assert.equal(world.rootEl.querySelector(".raffle-winner"), null, "a roda renovada não aponta mais pra ele: o cartão some");
  assert.equal(labelsOf(world.rootEl).length, 3, "3 restantes = 4 cadastrados menos o ganhador");
  assert.ok(labelsOf(world.rootEl).includes("Nova Pessoa"), "quem chegou no meio entra na roda renovada");
});

test("giros seguidos têm sempre a mesma duração visual (voltas inteiras a mais, não crescem)", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 6);
  await world.signIn();
  const degOf = () => parseFloat(world.rootEl.querySelector(".raffle-wheel").style.transform.match(/rotate\(([-\d.]+)deg\)/)[1]);
  const gaps = [];
  let previous = 0;
  for (let i = 0; i < 4; i++) {
    await world.spin();
    gaps.push(degOf() - previous);
    await world.releaseReveal();
    previous = degOf();
  }
  gaps.forEach(gap => assert.ok(gap >= 2160 && gap < 2160 + 360, `giro de ${gap}°`));
});

test("modo telão: liga e desliga, pede tela cheia, mostra o QR e sai com Esc", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  assert.equal(world.rootEl.classList.contains("raffle-telao"), false);
  world.rootEl.querySelector("[data-raffle-telao-toggle]").click();
  await settle();
  assert.equal(world.rootEl.classList.contains("raffle-telao"), true);
  assert.equal(world.document.body.classList.contains("raffle-telao-open"), true);
  assert.equal(world.fullscreen.calls.enter, 1);
  assert.ok(world.rootEl.querySelector("#raffleQr"), "no telão o QR já aparece");
  assert.match(textOf(world.rootEl.querySelector("[data-raffle-telao-toggle]")), /Sair do modo telão/);
  world.document.dispatchEvent(new world.window.KeyboardEvent("keydown", { key: "Escape" }));
  await settle();
  assert.equal(world.rootEl.classList.contains("raffle-telao"), false);
  assert.equal(world.document.body.classList.contains("raffle-telao-open"), false);
  assert.equal(world.fullscreen.calls.exit, 1);
});

test("modo telão: sair da tela cheia pelo navegador também sai do telão", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  world.rootEl.querySelector("[data-raffle-telao-toggle]").click();
  await settle();
  world.fullscreen.setActive(false);
  world.document.dispatchEvent(new world.window.Event("fullscreenchange"));
  await settle();
  assert.equal(world.rootEl.classList.contains("raffle-telao"), false);
});

test("?telao=1 (startInTelao): já abre em modo telão, até na tela de login, e dá pra sair dela", async () => {
  const world = setup({ startInTelao: true });
  await settle();
  assert.equal(world.rootEl.classList.contains("raffle-telao"), true);
  assert.ok(world.rootEl.querySelector("[data-raffle-telao-toggle]"), "na tela de login também tem o botão de sair do telão");
  await world.signIn();
  assert.equal(world.rootEl.classList.contains("raffle-telao"), true);
  assert.ok(world.rootEl.querySelector("#raffleQr"));
});

test("Ausente no cartão do ganhador: marca no banco, o cartão some, o prêmio não é gasto e a pessoa não volta", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  const firstDraw = world.draws.docs[0];
  assert.equal(firstDraw.status, "winner");
  assert.equal(firstDraw.prize, 1);
  world.rootEl.querySelector(".raffle-winner [data-raffle-absent]").click();
  await settle();
  assert.equal(world.draws.docs[0].status, "absent");
  assert.equal(world.rootEl.querySelector(".raffle-winner"), null, "o cartão some");
  assert.equal(world.rootEl.querySelector(".raffle-drawn-badge").textContent, "Ausente");
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /2\s*Na lista/);
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /0\s*Já sorteados/, "ausente não conta como prêmio entregue");
  await world.spin();
  const second = world.draws.docs[1];
  assert.equal(second.prize, 1, "o prêmio 1 continua disponível");
  assert.notEqual(second.entryId, firstDraw.entryId, "o ausente não volta pra roleta");
  assert.match(textOf(world.rootEl.querySelector(".raffle-winner-label")), /prêmio 1/);
});

test("Ausente pela lista de sorteados funciona depois que o cartão do ganhador já sumiu", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  await world.releaseReveal(); // o tempo do ganhador acabou: sem cartão
  assert.equal(world.rootEl.querySelector(".raffle-winner"), null);
  world.rootEl.querySelector(".raffle-drawn-list [data-raffle-absent]").click();
  await settle();
  assert.equal(world.draws.docs[0].status, "absent");
  assert.equal(world.rootEl.querySelector(".raffle-drawn-list [data-raffle-absent]"), null, "quem já é ausente não tem mais botão");
});

test("Ausente: se o banco recusar, avisa e não muda nada na tela", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  world.draws.update = async () => { throw new Error("offline"); };
  world.rootEl.querySelector(".raffle-winner [data-raffle-absent]").click();
  await settle();
  assert.match(textOf(world.rootEl), /Não foi possível marcar como ausente/);
  assert.ok(world.rootEl.querySelector(".raffle-winner"), "o ganhador continua no cartão");
  assert.equal(world.draws.docs[0].status, "winner");
});

test("Ausente no modo DEV (lista de teste): só em memória, sem gravar", async () => {
  const devSeed = [{ id: "dev_0", firstName: "Renato", lastName: "Ramos" }, { id: "dev_1", firstName: "Bianca", lastName: "Issa" }];
  const world = setup({ signedIn: true, devSeed });
  await world.signIn();
  await world.spin();
  world.rootEl.querySelector(".raffle-winner [data-raffle-absent]").click();
  await settle();
  assert.equal(world.draws.docs.length, 0);
  assert.equal(world.rootEl.querySelector(".raffle-drawn-badge").textContent, "Ausente");
  await world.spin();
  assert.match(textOf(world.rootEl.querySelector(".raffle-winner-label")), /prêmio 1/);
});

// ---------- QR que muda ----------
test("QR do sorteio: ao mostrar, publica o primeiro código; a cada virada grava o novo com o anterior", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  assert.equal(world.session.writes.length, 0, "sem QR na tela, ninguém precisa de código");
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  assert.deepEqual(world.session.writes, [{ id: "current", code: "CODIGO1X" }]);
  await world.rotateCode();
  assert.deepEqual(world.session.writes.at(-1), { id: "current", code: "CODIGO2X", previous: "CODIGO1X" });
  await world.rotateCode();
  assert.deepEqual(world.session.writes.at(-1), { id: "current", code: "CODIGO3X", previous: "CODIGO2X" });
});

test("QR do sorteio: esconder o QR para a virada do código; mostrar de novo começa um código novo", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  assert.equal(world.ticks.length, 1);
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  assert.equal(world.ticks.length, 0, "a virada parou");
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  assert.equal(world.session.writes.at(-1).code, "CODIGO2X");
  assert.equal(world.session.writes.at(-1).previous, undefined, "recomeçou sem anterior");
});

test("QR do sorteio: sair da conta para a virada do código", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  world.rootEl.querySelector("[data-mod-signout]").click();
  await settle();
  assert.equal(world.ticks.length, 0);
});

test("QR do sorteio: modo telão liga o QR e a virada do código", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  world.rootEl.querySelector("[data-raffle-telao-toggle]").click();
  await settle();
  assert.equal(world.session.writes.length, 1);
  assert.equal(world.ticks.length, 1);
});

test("QR do sorteio: se o banco recusar gravar o código, avisa e continua tentando na virada seguinte", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  world.session.fail = true;
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  assert.match(textOf(world.rootEl), /Não consegui publicar o código do QR/);
  world.session.fail = false;
  await world.rotateCode();
  assert.doesNotMatch(textOf(world.rootEl), /Não consegui publicar o código do QR/);
  assert.equal(world.session.writes.at(-1).code, "CODIGO2X");
});

test("QR do sorteio: a virada do código não redesenha a roleta (não corta o giro)", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  const wheelEl = world.rootEl.querySelector(".raffle-wheel");
  await world.rotateCode();
  assert.equal(world.rootEl.querySelector(".raffle-wheel"), wheelEl, "é o mesmo elemento da roda");
});

test("QR do sorteio: o QR carrega o código atual, troca a cada virada e fica maior no telão", async () => {
  const world = setup({ signedIn: true });
  await world.signIn();
  world.rootEl.querySelector("[data-raffle-qr-toggle]").click();
  await settle();
  assert.match(world.qrDraws.at(-1).text, /\?checkin=CODIGO1X$/);
  assert.equal(world.qrDraws.at(-1).size, 176);
  await world.rotateCode();
  assert.match(world.qrDraws.at(-1).text, /\?checkin=CODIGO2X$/);
  world.rootEl.querySelector("[data-raffle-telao-toggle]").click();
  await settle();
  assert.equal(world.qrDraws.at(-1).size, 320);
  assert.match(world.qrDraws.at(-1).text, /\?checkin=CODIGO2X$/, "entrar no telão não troca o código");
});

// ---------- nomes repetidos ----------
test("nomes repetidos: avisa o moderador, mas ninguém sai da roleta", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "José", "da Silva");
  world.seedEntry("u2_raffle", "jose", "DA SILVA");
  world.seedEntry("u3_raffle", "Ana", "Souza");
  await world.signIn();
  const notice = textOf(world.rootEl.querySelector(".raffle-repeated"));
  assert.match(notice, /1 nome repetido na lista: José da Silva \(2\)/);
  assert.match(notice, /confira o ingresso no palco/);
  assert.equal(world.rootEl.querySelector(".raffle-counter-value").textContent, "3", "os 3 continuam cadastrados");
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /3\s*Na lista/, "e os 3 continuam na roleta");
});

test("nomes repetidos: sem repetição não mostra aviso", async () => {
  const world = setup({ signedIn: true });
  world.seedEntry("u1_raffle", "Ana", "Souza");
  world.seedEntry("u2_raffle", "Bruno", "Lima");
  await world.signIn();
  assert.equal(world.rootEl.querySelector(".raffle-repeated"), null);
});

// ---------- papel picado ----------
test("papel picado: dispara uma vez quando o ganhador é revelado, com a explosão saindo do cartão dele", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  world.window.Element.prototype.getBoundingClientRect = function () { return this.classList?.contains("raffle-winner") ? { left: 100, top: 200, width: 300, height: 100 } : { left: 0, top: 0, width: 0, height: 0 }; };
  await world.spin();
  assert.equal(world.confettiFires.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(world.confettiFires[0].origin)), { x: 250, y: 235 });
  assert.equal(world.confettiFires[0].force, false, "fora do telão respeita 'Reduzir movimento'");
});

test("papel picado: no modo telão sempre dispara (force)", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  world.rootEl.querySelector("[data-raffle-telao-toggle]").click();
  await settle();
  await world.spin();
  assert.equal(world.confettiFires.at(-1).force, true);
});

test("papel picado: um giro por prêmio, e nada ao marcar ausente ou quando o banco recusa o sorteio", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 4);
  await world.signIn();
  await world.spin();
  await world.spin();
  assert.equal(world.confettiFires.length, 2);
  world.rootEl.querySelector(".raffle-winner [data-raffle-absent]").click();
  await settle();
  assert.equal(world.confettiFires.length, 2, "ausente não comemora");
  world.draws.addWithId = async () => { throw new Error("offline"); };
  await world.spin();
  assert.equal(world.confettiFires.length, 2, "sem ganhador gravado, sem festa");
});

// ---------- som ----------
test("som: a revelação toca a fanfarra de festa inteira (e o tique enquanto gira não conta como fanfarra)", async () => {
  audioLog.contexts = 0; audioLog.oscillators = 0;
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  assert.ok(audioLog.oscillators >= 18, `tocou ${audioLog.oscillators} notas`);
});

test("som: botão Som desliga e liga; mudo não cria áudio nenhum", async () => {
  audioLog.contexts = 0; audioLog.oscillators = 0;
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  assert.match(textOf(world.rootEl.querySelector("[data-raffle-sound-toggle]")), /Som: ligado/);
  world.rootEl.querySelector("[data-raffle-sound-toggle]").click();
  await settle();
  assert.match(textOf(world.rootEl.querySelector("[data-raffle-sound-toggle]")), /Som: desligado/);
  assert.equal(world.rootEl.querySelector("[data-raffle-sound-toggle]").getAttribute("aria-pressed"), "false");
  await world.spin();
  assert.equal(audioLog.oscillators, 0, "mudo: nenhuma nota");
  assert.equal(audioLog.contexts, 0, "mudo: nem abre o áudio");
  assert.ok(world.rootEl.querySelector(".raffle-winner"), "o sorteio acontece do mesmo jeito");
  world.rootEl.querySelector("[data-raffle-sound-toggle]").click();
  await settle();
  await world.spin();
  assert.ok(audioLog.oscillators >= 18, "ligou de novo: toca");
});

test("som: marcar ausente não toca nada", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  const before = audioLog.oscillators;
  world.rootEl.querySelector(".raffle-winner [data-raffle-absent]").click();
  await settle();
  assert.equal(audioLog.oscillators, before);
});

// ---------- resetar = nova rodada (nada é apagado, nada é baixado) ----------
const typeResetWord = async (world, word) => {
  const input = world.rootEl.querySelector("[data-raffle-reset-word]");
  input.value = word;
  input.dispatchEvent(new world.window.Event("input", { bubbles: true }));
  await settle();
};
const openReset = async world => { world.rootEl.querySelector("[data-raffle-reset-open]").click(); await settle(); };
const confirmReset = async world => { world.rootEl.querySelector("[data-raffle-reset-confirm]").click(); await settle(); };
const doReset = async world => { await openReset(world); await typeResetWord(world, "RESETAR"); await confirmReset(world); };

test("rodada: sem documento de estado a rodada é a 1; enquanto não sabe a rodada, o botão de girar espera", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  world.state.errorOnListen = false;
  await world.signIn();
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, false);
  await world.spin();
  assert.equal(world.draws.docs[0].round, 1);
  assert.equal(world.draws.docs[0].id, `${world.draws.docs[0].entryId}_draw`, "a rodada 1 mantém o id de sempre");
});

test("rodada: com o banco já na rodada 2, o sorteio grava na rodada 2 e o id leva a rodada", async () => {
  const world = setup({ signedIn: true, initialRound: 2 });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  assert.equal(world.draws.docs[0].round, 2);
  assert.equal(world.draws.docs[0].id, `${world.draws.docs[0].entryId}_r2_draw`);
});

test("rodada: sorteios de rodadas anteriores não contam (a pessoa está na roleta, o prêmio recomeça e a lista só mostra a atual)", async () => {
  const world = setup({ signedIn: true, initialRound: 2 });
  manyEntries(world, 3);
  world.draws.seed({ id: "u1_raffle_draw", entryId: "u1_raffle", name: "P1 S1", prize: 1, status: "winner" }); // rodada 1 (sem campo round)
  world.draws.seed({ id: "u2_raffle_r2_draw", entryId: "u2_raffle", name: "P2 S2", prize: 1, status: "winner", round: 2 });
  await world.signIn();
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /2\s*Na lista/, "u1 voltou pra roleta, só u2 saiu na rodada atual");
  assert.deepEqual([...world.rootEl.querySelectorAll(".raffle-drawn-name")].map(el => el.textContent), ["P2 S2"]);
  await world.spin();
  assert.equal(world.draws.docs.at(-1).prize, 2, "o 2º prêmio da rodada atual");
});

test("reset: o botão só existe quando já há algum sorteio na rodada", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  assert.equal(world.rootEl.querySelector("[data-raffle-reset-open]"), null);
  await world.spin();
  assert.ok(world.rootEl.querySelector("[data-raffle-reset-open]"));
});

test("reset: pede a palavra RESETAR (qualquer caixa) antes de liberar; cancelar fecha sem fazer nada", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  await openReset(world);
  assert.match(textOf(world.rootEl.querySelector(".raffle-reset")), /digite RESETAR/);
  assert.match(textOf(world.rootEl.querySelector(".raffle-reset")), /Nada é apagado/);
  const confirmBtn = () => world.rootEl.querySelector("[data-raffle-reset-confirm]");
  assert.equal(confirmBtn().disabled, true);
  await typeResetWord(world, "reset");
  assert.equal(confirmBtn().disabled, true, "palavra incompleta não libera");
  await confirmReset(world);
  assert.equal(world.state.sets.length, 0, "clicar travado não faz nada");
  await typeResetWord(world, "resetar");
  assert.equal(confirmBtn().disabled, false);
  world.rootEl.querySelector("[data-raffle-reset-cancel]").click();
  await settle();
  assert.equal(world.rootEl.querySelector(".raffle-reset"), null);
  assert.equal(world.state.sets.length, 0);
});

test("reset: abre a rodada 2 SEM apagar nada, todo mundo (ganhadores e ausentes) volta pra roleta e o prêmio recomeça do 1", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 4);
  await world.signIn();
  await world.spin();
  world.rootEl.querySelector(".raffle-winner [data-raffle-absent]").click();
  await settle();
  await world.spin();
  await world.spin();
  assert.equal(world.draws.docs.length, 3);
  await doReset(world);
  assert.deepEqual(world.state.sets, [{ id: "current", round: 2 }]);
  assert.equal(world.draws.docs.length, 3, "NADA foi apagado: os sorteios da rodada 1 continuam guardados");
  assert.equal(world.rootEl.querySelector(".raffle-reset"), null, "a caixa fechou");
  assert.equal(world.rootEl.querySelector(".raffle-winner"), null);
  assert.equal(world.rootEl.querySelector("[data-raffle-reset-open]"), null, "sem sorteios na rodada nova, o botão some");
  assert.equal(world.rootEl.querySelectorAll(".raffle-drawn-item").length, 0);
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /4\s*Na lista/, "inclusive o ausente voltou");
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /0\s*Já sorteados/);
  assert.equal(world.rootEl.querySelectorAll(".raffle-wheel-label").length, 4);
  await world.spin();
  const fresh = world.draws.docs.at(-1);
  assert.equal(fresh.round, 2);
  assert.equal(fresh.prize, 1, "recomeça do prêmio 1");
  assert.match(fresh.id, /_r2_draw$/);
});

test("reset: quem já saiu na rodada 1 pode sair de novo na rodada 2, mas não duas vezes na mesma", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 1);
  await world.signIn();
  await world.spin();
  const first = world.draws.docs[0];
  await doReset(world);
  await world.spin();
  assert.equal(world.draws.docs.length, 2);
  assert.equal(world.draws.docs[1].entryId, first.entryId, "a única pessoa saiu de novo");
  assert.notEqual(world.draws.docs[1].id, first.id);
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, true, "e agora não sobra ninguém na rodada 2");
});

test("reset: os cadastros e o contador não mudam", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  await doReset(world);
  assert.equal(world.entries.docs.length, 3);
  assert.equal(world.rootEl.querySelector(".raffle-counter-value").textContent, "3");
});

test("reset: não baixa nenhum arquivo", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  const anchors = [];
  const original = world.document.createElement.bind(world.document);
  world.document.createElement = tag => { const el = original(tag); if (tag === "a") anchors.push(el); return el; };
  await doReset(world);
  assert.equal(anchors.length, 0);
});

test("reset: se o banco recusar, mostra o erro, não muda a tela e deixa tentar de novo", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  world.state.fail = true;
  await doReset(world);
  assert.match(textOf(world.rootEl), /Não foi possível resetar agora/);
  assert.ok(world.rootEl.querySelector(".raffle-reset"), "a caixa continua aberta");
  assert.ok(world.rootEl.querySelector(".raffle-winner"), "o ganhador continua na tela");
  world.state.fail = false;
  await typeResetWord(world, "RESETAR");
  await confirmReset(world);
  assert.equal(world.state.sets.length, 1);
  assert.doesNotMatch(textOf(world.rootEl), /Não foi possível resetar/);
});

test("reset por OUTRA tela do moderador: esta tela também recomeça do zero sozinha", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  await world.signIn();
  await world.spin();
  assert.ok(world.rootEl.querySelector(".raffle-winner"));
  world.state.emit({ round: 2 });
  await settle();
  assert.equal(world.rootEl.querySelector(".raffle-winner"), null);
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /3\s*Na lista/);
  assert.equal(world.rootEl.querySelectorAll(".raffle-drawn-item").length, 0);
});

test("reset no modo DEV (lista de teste): zera só em memória, sem mexer no banco", async () => {
  const devSeed = [{ id: "dev_0", firstName: "Renato", lastName: "Ramos" }, { id: "dev_1", firstName: "Bianca", lastName: "Issa" }];
  const world = setup({ signedIn: true, devSeed });
  await world.signIn();
  await world.spin();
  await doReset(world);
  assert.equal(world.state.sets.length, 0);
  assert.match(textOf(world.rootEl.querySelector(".raffle-stats")), /2\s*Na lista/);
  assert.equal(world.rootEl.querySelectorAll(".raffle-drawn-item").length, 0);
});

test("erro ao ler a rodada (regras não publicadas): avisa mas a roleta não trava", async () => {
  const world = setup({ signedIn: true });
  manyEntries(world, 3);
  world.state.errorOnListen = true;
  await world.signIn();
  assert.match(textOf(world.rootEl), /Não foi possível carregar os sorteios/);
  assert.equal(world.rootEl.querySelector("[data-raffle-spin]").disabled, false);
});
