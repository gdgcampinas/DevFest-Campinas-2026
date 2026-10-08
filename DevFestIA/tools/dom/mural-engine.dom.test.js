/**
 * Testes de FALHA do motor do mural (docs/js/features/mural.js): o telão não tem ninguém operando, então cada defeito tem que se corrigir sozinho.
 * Relógio falso (tools/lib/fake-clock.js): horas de telão em milissegundos. Cobre: cena que erra no prepare/render/mount, prepare que trava, cena sem
 * nada pra mostrar, cena de reserva e HTML de emergência, erro solto da página, interrupção, retomada depois da recarga, vigia de prazo e um teste de
 * resistência de 8 horas.
 *   node --test DevFestIA/tools/dom/mural-engine.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, memoryStorage } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: ["features/scheduler.js", "features/mural-playlist.js", "features/mural-health.js", "features/mural.js"] });
const { document, window } = site;
test.after(() => window.close());
const createMural = site.get("createMural");
const MURAL_SKIP = site.get("MURAL_SKIP");
const createReloadLedger = site.get("createReloadLedger");
const evaluateHealth = site.get("evaluateHealth");

const config = { defaultSeconds: 10, holdCheckMs: 5000, transitionMs: 600, prepareTimeoutMs: 8000, failureCooldownMs: 120000, skipCooldownMs: 60000, retryDelayMs: 500, reserveSeconds: 20, idleRetryMs: 5000, watchdogSlackMs: 5000, maxConsecutiveFailures: 6, preventiveReloadMs: 2 * 3600000, reloadStormWindowMs: 600000, reloadStormMax: 3 };
const okScene = (id, extra = {}) => ({ id, type: "ok", params: { label: id }, ...extra });
const okImpl = { render: (_prepared, params) => ({ markup: `<p>${params.label}</p>` }) };
const reserveScene = { id: "reserva", type: "reserve", params: {} };
const reserveImpl = { render: () => ({ markup: "<p>RESERVA</p>" }) };

function setup({ scenes, registry = {}, ledger = null, extra = {}, liveCtx = {} }) {
  const clock = createFakeClock();
  const contentEl = document.createElement("div");
  document.body.appendChild(contentEl);
  const events = { changes: [], failures: [] };
  const mural = createMural({
    contentEl, scenes, config, schedule: clock.schedule, nowMs: clock.nowMs, ledger, reserveScene, emergencyMarkup: "<p>EMERGENCIA</p>",
    registry: { ok: okImpl, reserve: reserveImpl, ...registry },
    getContext: () => ({ now: new Date(clock.nowMs()), reveal: true, phase: "live", live: liveCtx }),
    onSceneChange: change => events.changes.push(change.scene.id),
    onFailure: (scene, error) => events.failures.push([scene.id, error.message]),
    ...extra,
  });
  const active = () => contentEl.querySelector(".mural-scene.is-active")?.dataset.scene ?? null;
  const text = () => contentEl.querySelector(".mural-scene.is-active")?.textContent ?? contentEl.textContent;
  return { clock, mural, contentEl, events, active, text };
}

test("rodízio: mostra a primeira cena, troca no tempo de cada uma e dá a volta; a antiga sai depois da transição", async () => {
  const { clock, mural, contentEl, active } = setup({ scenes: [okScene("a", { seconds: 10 }), okScene("b", { seconds: 5 })] });
  mural.start();
  await clock.tick(0);
  assert.equal(active(), "a");
  await clock.tick(10000);
  assert.equal(active(), "b");
  assert.equal(contentEl.querySelectorAll(".mural-scene").length, 2, "a antiga ainda está saindo");
  await clock.tick(600);
  assert.equal(contentEl.querySelectorAll(".mural-scene").length, 1);
  await clock.tick(5000);
  assert.equal(active(), "a");
  mural.stop();
});

test("cada cena sai com o tempo de tela (--scene-ms) e a transição de entrada do dado, com padrão da config", async () => {
  const { clock, mural, contentEl } = setup({ scenes: [okScene("a", { seconds: 7, transition: "zoom" }), okScene("b")], extra: { config: { ...config, motion: { defaultTransition: "rise" } } } });
  mural.start();
  await clock.tick(0);
  const first = contentEl.querySelector('[data-scene="a"]');
  assert.equal(first.dataset.transition, "zoom");
  assert.equal(first.style.getPropertyValue("--scene-ms"), "7000");
  await clock.tick(7000);
  const second = contentEl.querySelector('[data-scene="b"]');
  assert.equal(second.dataset.transition, "rise", "sem `transition` na cena vale o padrão da config");
  assert.equal(second.style.getPropertyValue("--scene-ms"), "10000");
  mural.stop();
});

test("cena que erra no render é pulada na hora, vai de castigo e volta depois; as outras seguem", async () => {
  const { clock, mural, active, events } = setup({
    scenes: [okScene("a"), okScene("quebra", { type: "boom" }), okScene("b")],
    registry: { boom: { render: () => { throw new Error("render quebrou"); } } },
  });
  mural.start();
  await clock.tick(0);
  assert.equal(active(), "a");
  await clock.tick(10000);
  await clock.tick(600);
  assert.equal(active(), "b", "pulou a que quebra");
  assert.deepEqual(events.failures, [["quebra", "render quebrou"]]);
  assert.deepEqual([...mural.state().cooling], ["quebra"]);
  await clock.tick(130000); // castigo (2 min) acaba
  assert.ok(events.failures.length >= 2, "tentou de novo depois do castigo");
  mural.stop();
});

test("erro no prepare e no mount: mesma coisa, e o elemento da cena que falhou no mount não fica na tela", async () => {
  const { clock, mural, active, contentEl, events } = setup({
    scenes: [okScene("p", { type: "prep" }), okScene("m", { type: "mnt" }), okScene("ok1")],
    registry: {
      prep: { prepare: async () => { throw new Error("prepare quebrou"); }, render: okImpl.render },
      mnt: { render: () => ({ markup: "<p>M</p>", mount: () => { throw new Error("mount quebrou"); } }) },
    },
  });
  mural.start();
  await clock.tick(5000);
  assert.equal(active(), "ok1");
  assert.deepEqual(events.failures.map(([id]) => id), ["p", "m"]);
  assert.equal(contentEl.querySelector('[data-scene="m"]'), null);
  mural.stop();
});

test("prepare que nunca termina estoura o tempo limite e o rodízio segue", async () => {
  const { clock, mural, active, events } = setup({
    scenes: [okScene("trava", { type: "hang" }), okScene("b")],
    registry: { hang: { prepare: () => new Promise(() => {}), render: okImpl.render } },
  });
  mural.start();
  await clock.tick(7999);
  assert.equal(active(), null, "ainda esperando o prepare");
  await clock.tick(2000);
  assert.equal(active(), "b");
  assert.match(events.failures[0][1], /prepare demorou demais/);
  mural.stop();
});

test("cena sem nada pra mostrar (MURAL_SKIP) não conta como falha e só descansa um pouco", async () => {
  const { clock, mural, active, events } = setup({
    scenes: [okScene("vazia", { type: "skip" }), okScene("b")],
    registry: { skip: { prepare: () => MURAL_SKIP, render: okImpl.render } },
  });
  mural.start();
  await clock.tick(1);
  assert.equal(active(), "b");
  assert.equal(events.failures.length, 0);
  assert.equal(mural.state().failures, 0);
  assert.deepEqual([...mural.state().cooling], ["vazia"]);
  mural.stop();
});

test("sem nenhuma cena disponível: entra a RESERVA; e quando uma cena volta a ficar disponível o mural sai da reserva", async () => {
  const liveCtx = {};
  const { clock, mural, active, contentEl } = setup({ scenes: [okScene("so-com-fonte", { requires: { live: "x" } })], liveCtx });
  mural.start();
  await clock.tick(0);
  assert.equal(active(), "reserva");
  const reserveEl = contentEl.querySelector(".mural-scene.is-active");
  await clock.tick(5000);
  assert.equal(contentEl.querySelector(".mural-scene.is-active"), reserveEl, "a reserva não é redesenhada enquanto continua sendo a única opção");
  assert.equal(mural.state().shown, 1);
  liveCtx.x = true;
  await clock.tick(5000);
  assert.equal(active(), "so-com-fonte", "o dado ao vivo chegou: sai da reserva em até 5 s, não em 20");
  mural.stop();
});

test("se até a reserva falhar, aparece o HTML de emergência (a tela nunca fica preta) e o mural continua tentando", async () => {
  const { clock, mural, text } = setup({ scenes: [], registry: { reserve: { render: () => { throw new Error("reserva quebrou"); } } } });
  mural.start();
  await clock.tick(0);
  assert.equal(text(), "EMERGENCIA");
  await clock.tick(60000);
  assert.equal(text(), "EMERGENCIA");
  assert.ok(mural.state().shown === 0);
  mural.stop();
});

test("tipo de cena não registrado é só mais uma cena com defeito", async () => {
  const { clock, mural, active, events } = setup({ scenes: [okScene("x", { type: "nao-existe" }), okScene("b")] });
  mural.start();
  await clock.tick(1000);
  assert.equal(active(), "b");
  assert.match(events.failures[0][1], /tipo de cena não registrado/);
  mural.stop();
});

test("erro solto da página enquanto a cena está no ar (window.error): castiga a cena e passa pra próxima na hora", async () => {
  const { clock, mural, active } = setup({ scenes: [okScene("a"), okScene("b")] });
  mural.start();
  await clock.tick(0);
  mural.reportError(new Error("erro assíncrono"));
  await clock.tick(0);
  assert.equal(active(), "b");
  mural.reportError(new Error("outro"));
  mural.reportError(new Error("e outro, no mesmo instante")); // a mesma cena não é castigada duas vezes
  await clock.tick(0);
  assert.equal(mural.state().cooling.length, 2);
  mural.stop();
});

test("erro solto durante a reserva não faz nada (a reserva não tem pra onde fugir)", async () => {
  const { clock, mural, active } = setup({ scenes: [] });
  mural.start();
  await clock.tick(0);
  mural.reportError(new Error("x"));
  await clock.tick(0);
  assert.equal(active(), "reserva");
  mural.stop();
});

test("o dispose da cena roda quando ela sai (relógio, listener, animação não vazam)", async () => {
  let mounts = 0;
  let disposes = 0;
  const { clock, mural } = setup({
    scenes: [okScene("a", { type: "live" }), okScene("b")],
    registry: { live: { render: () => ({ markup: "<p>L</p>", mount: () => { mounts++; return () => { disposes++; }; } }) } },
  });
  mural.start();
  await clock.tick(0);
  assert.deepEqual([mounts, disposes], [1, 0]);
  await clock.tick(10000);
  assert.deepEqual([mounts, disposes], [1, 1]);
  mural.stop();
});

test("mount que devolve algo que não é função (ex.: instância do QR) não vira dispose nem quebra a troca", async () => {
  const { clock, mural, active, events } = setup({
    scenes: [okScene("a", { type: "obj" }), okScene("b")],
    registry: { obj: { render: () => ({ markup: "<p>O</p>", mount: () => ({ instancia: true }) }) } },
  });
  mural.start();
  await clock.tick(10000);
  assert.equal(active(), "b");
  assert.equal(events.failures.length, 0);
  assert.equal(mural.state().lastError, null);
  mural.stop();
});

test("dispose que lança não derruba o rodízio", async () => {
  const { clock, mural, active } = setup({
    scenes: [okScene("a", { type: "live" }), okScene("b")],
    registry: { live: { render: () => ({ markup: "<p>L</p>", mount: () => () => { throw new Error("dispose quebrou"); } }) } },
  });
  mural.start();
  await clock.tick(10000);
  assert.equal(active(), "b");
  assert.match(mural.state().lastError, /dispose/);
  mural.stop();
});

test("interrupção entra na frente uma vez; com immediate corta a cena atual agora", async () => {
  const { clock, mural, active } = setup({ scenes: [okScene("a"), okScene("b"), okScene("podio")] });
  mural.start();
  await clock.tick(0);
  mural.pushInterrupt({ sceneId: "podio", priority: 90 });
  await clock.tick(10000);
  assert.equal(active(), "podio", "na próxima troca, a interrupção vem antes da fila");
  await clock.tick(10000);
  assert.equal(active(), "a", "a interrupção foi usada só uma vez; a fila segue de onde estava");
  mural.pushInterrupt({ sceneId: "b", priority: 10, immediate: true });
  await clock.tick(0);
  assert.equal(active(), "b", "imediata corta a cena atual");
  mural.stop();
});

test("interrupção vencida (ninguém trocou de cena a tempo) é descartada", async () => {
  const { clock, mural, active } = setup({ scenes: [okScene("a", { seconds: 100 }), okScene("b"), okScene("podio")] });
  mural.start();
  await clock.tick(0);
  mural.pushInterrupt({ sceneId: "podio", ttlMs: 5000 });
  await clock.tick(100000);
  assert.equal(active(), "b");
  mural.stop();
});

test("retomada: depois de recarregar volta pra cena em que estava (e a grava a cada cena)", async () => {
  const storage = memoryStorage();
  const first = setup({ scenes: [okScene("a"), okScene("b"), okScene("c")], ledger: createReloadLedger({ storage }) });
  first.mural.start();
  await first.clock.tick(10000);
  assert.equal(first.active(), "b");
  first.mural.stop();

  const second = setup({ scenes: [okScene("a"), okScene("b"), okScene("c")], ledger: createReloadLedger({ storage }) });
  second.mural.start();
  await second.clock.tick(0);
  assert.equal(second.active(), "b", "volta onde estava");
  second.mural.stop();
});

test("retomada com cena que não existe mais começa do início", async () => {
  const storage = memoryStorage({ "devfest-campinas-2026:mural": JSON.stringify({ lastSceneId: "sumiu" }) });
  const { clock, mural, active } = setup({ scenes: [okScene("a"), okScene("b")], ledger: createReloadLedger({ storage }) });
  mural.start();
  await clock.tick(0);
  assert.equal(active(), "a");
  mural.stop();
});

test("gancho de troca: se pedir recarga (preventiva, versão), o rodízio pára de trocar", async () => {
  let reload = false;
  const { clock, mural, active } = setup({ scenes: [okScene("a"), okScene("b")], extra: { onBoundary: () => reload } });
  mural.start();
  await clock.tick(0);
  reload = true;
  await clock.tick(10000);
  assert.equal(active(), "a", "não trocou: a página está recarregando");
  mural.stop();
});

test("prazo do vigia: depois de cada troca o prazo da próxima é duração + folga; passou do prazo = 'stuck'", async () => {
  const { clock, mural } = setup({ scenes: [okScene("a")] });
  mural.start();
  await clock.tick(0);
  const state = mural.state();
  assert.equal(state.beatDueAt, clock.nowMs() + 10000 + config.watchdogSlackMs);
  const health = (now, snapshot) => evaluateHealth({ now, ...snapshot }, config);
  assert.equal(health(clock.nowMs() + 14999, { startedAt: state.startedAt, beatDueAt: state.beatDueAt }).action, "none");
  assert.equal(health(clock.nowMs() + 15001, { startedAt: state.startedAt, beatDueAt: state.beatDueAt }).reason, "stuck");
  mural.stop();
});

test("rodízio que PERDE o timer (travou de verdade): o prazo estoura e o vigia manda recarregar", async () => {
  const clock = createFakeClock();
  const lostTimers = () => () => {}; // o timer some, como numa aba congelada
  const contentEl = document.createElement("div");
  document.body.appendChild(contentEl);
  const mural = createMural({
    contentEl, scenes: [okScene("a")], registry: { ok: okImpl, reserve: reserveImpl }, reserveScene, config,
    schedule: lostTimers, nowMs: clock.nowMs, getContext: () => ({ now: new Date(), reveal: true, phase: "live", live: {} }),
  });
  mural.start();
  await clock.tick(60000);
  const state = mural.state();
  assert.equal(state.shown, 1, "a troca nunca aconteceu");
  const verdict = evaluateHealth({ now: clock.nowMs(), startedAt: state.startedAt, beatDueAt: state.beatDueAt }, config);
  assert.deepEqual([verdict.action, verdict.reason], ["reload", "stuck"]);
  mural.stop();
});

test("falhas em sequência acumulam e o sucesso zera; passou do limite o vigia recarrega", async () => {
  const scenes = Array.from({ length: 8 }, (_, i) => okScene(`q${i}`, { type: "boom" }));
  const { clock, mural } = setup({ scenes, registry: { boom: { render: () => { throw new Error("tudo quebrado"); } } } });
  mural.start();
  await clock.tick(5000);
  const state = mural.state();
  assert.ok(state.failures >= config.maxConsecutiveFailures, `falhas ${state.failures}`);
  assert.equal(evaluateHealth({ now: clock.nowMs(), startedAt: state.startedAt, beatDueAt: Infinity, failures: state.failures }, config).reason, "scene-failures");
  mural.stop();

  const healthy = setup({ scenes: [okScene("a", { type: "boom" }), okScene("b")], registry: { boom: { render: () => { throw new Error("x"); } } } });
  healthy.mural.start();
  await healthy.clock.tick(1000);
  assert.equal(healthy.mural.state().failures, 0, "a cena boa que veio depois zerou a contagem");
  healthy.mural.stop();
});

test("RESISTÊNCIA: 8 horas de telão com cenas que falham, travam e voltam; sempre tem algo na tela e nada se acumula", async () => {
  let calls = 0;
  const flaky = {
    prepare: async () => { calls++; if (calls % 3 === 0) throw new Error("falha intermitente"); if (calls % 7 === 0) return MURAL_SKIP; },
    render: (_p, params) => ({ markup: `<p>${params.label}</p>`, mount: () => () => {} }),
  };
  const { clock, mural, contentEl, text } = setup({
    scenes: [okScene("a"), okScene("f1", { type: "flaky" }), okScene("b", { seconds: 6 }), okScene("f2", { type: "flaky" })],
    registry: { flaky },
  });
  mural.start();
  let blank = 0;
  let maxLayers = 0;
  for (let minute = 0; minute < 8 * 60; minute++) {
    await clock.tick(60000);
    if (!text().trim()) blank++;
    maxLayers = Math.max(maxLayers, contentEl.querySelectorAll(".mural-scene").length);
  }
  assert.equal(blank, 0, "a tela nunca ficou vazia");
  assert.ok(maxLayers <= 2, `no máximo 2 camadas (entrando e saindo), teve ${maxLayers}`);
  assert.ok(mural.state().shown > 2000, `rodízio andou (${mural.state().shown} cenas)`);
  assert.ok(clock.pending() <= 3, `timers sobrando: ${clock.pending()}`);
  mural.stop();
  assert.equal(clock.pending() <= 1, true);
});

// ---------- controle remoto: fixar, pausar e emergência (hold) ----------
const emergencyScene = { id: "emergencia", type: "emergency", params: {} };
const emergencyImpl = { render: () => ({ markup: "<p>EMERGENCIA AO VIVO</p>" }) };

test("fixar: o rodízio PARA na cena pedida (entra na hora), segue o prazo do vigia sem redesenhar e, ao soltar, continua pela fila", async () => {
  const { clock, mural, active, contentEl } = setup({ scenes: [okScene("a", { seconds: 10 }), okScene("b", { seconds: 5 }), okScene("c", { seconds: 5 })] });
  mural.start();
  await clock.tick(0);
  assert.equal(active(), "a");
  mural.hold({ sceneId: "b" });
  await clock.tick(0);
  assert.equal(active(), "b", "a cena fixada entra na hora");
  assert.equal(mural.state().held, "b");
  const drawn = contentEl.querySelector('[data-scene="b"]');
  await clock.tick(10 * 60000);
  assert.equal(active(), "b", "10 minutos depois continua nela");
  assert.equal(contentEl.querySelector('[data-scene="b"]'), drawn, "e é a MESMA cena: não redesenhou");
  assert.ok(mural.state().beatDueAt > clock.nowMs(), "o prazo do vigia continua sendo renovado (parado de propósito não é travado)");
  mural.release();
  await clock.tick(0);
  assert.equal(mural.state().held, null);
  assert.equal(active(), "c", "solta: segue pela fila depois da fixada");
  mural.stop();
});

test("pausar (sem cena) fixa a que está no ar; o prazo solta sozinho; cena que não existe não faz nada", async () => {
  const { clock, mural, active } = setup({ scenes: [okScene("a", { seconds: 10 }), okScene("b", { seconds: 10 })] });
  mural.start();
  await clock.tick(0);
  mural.hold({ untilMs: clock.nowMs() + 30000 });
  assert.equal(mural.state().held, "a");
  await clock.tick(25000);
  assert.equal(active(), "a", "ainda pausada");
  await clock.tick(10000);
  assert.equal(mural.state().held, null, "o prazo acabou e o telão voltou a rodar sozinho");
  assert.equal(active(), "b");
  mural.hold({ sceneId: "nao-existe" });
  assert.equal(mural.state().held, null, "cena inexistente é ignorada");
  mural.stop();
});

test("interrupção (pódio publicado) não corta a cena fixada: o moderador mandou parar", async () => {
  const { clock, mural, active } = setup({ scenes: [okScene("a"), okScene("b"), okScene("podio")] });
  mural.start();
  await clock.tick(0);
  mural.hold({ sceneId: "a" });
  mural.pushInterrupt({ sceneId: "podio", priority: 100, ttlMs: 60000, immediate: true });
  await clock.tick(30000);
  assert.equal(active(), "a");
  mural.stop();
});

test("cena fixada que não tem nada pra mostrar ou que falha é SOLTA: o rodízio volta em vez de travar num laço", async () => {
  const skipping = setup({ scenes: [okScene("a"), okScene("vazia", { type: "empty" }), okScene("b")], registry: { empty: { prepare: () => MURAL_SKIP, render: () => ({ markup: "" }) } } });
  skipping.mural.start();
  await skipping.clock.tick(0);
  skipping.mural.hold({ sceneId: "vazia" });
  await skipping.clock.tick(1000);
  assert.equal(skipping.mural.state().held, null);
  assert.ok(["a", "b"].includes(skipping.active()), "voltou ao rodízio");
  skipping.mural.stop();
  const failing = setup({ scenes: [okScene("a"), okScene("quebra", { type: "boom" })], registry: { boom: { render: () => { throw new Error("quebrou"); } } } });
  failing.mural.start();
  await failing.clock.tick(0);
  failing.mural.hold({ sceneId: "quebra" });
  await failing.clock.tick(2000);
  assert.equal(failing.mural.state().held, null);
  assert.equal(failing.active(), "a");
  failing.mural.stop();
});

test("EMERGÊNCIA: a cena fica fora do rodízio (e do filtro ?cenas=), entra por ordem, para tudo, não é solta sozinha e a falha dela é segurada pelo HTML de emergência", async () => {
  const live = setup({ scenes: [okScene("a", { seconds: 10 })], registry: { emergency: emergencyImpl }, extra: { emergencyScene } });
  live.mural.start();
  await live.clock.tick(0);
  assert.equal(live.active(), "a");
  live.mural.hold({ sceneId: "emergencia", critical: true });
  await live.clock.tick(0);
  assert.equal(live.active(), "emergencia");
  assert.match(live.text(), /EMERGENCIA AO VIVO/);
  await live.clock.tick(3 * 3600000);
  assert.equal(live.active(), "emergencia", "3 horas depois continua: a emergência não vence sozinha");
  live.mural.release();
  await live.clock.tick(0);
  assert.equal(live.active(), "a", "desarmada: o rodízio volta");
  live.mural.stop();

  let broken = true;
  const failing = setup({ scenes: [okScene("a")], registry: { emergency: { render: () => { if (broken) throw new Error("render da emergência quebrou"); return { markup: "<p>VOLTOU</p>" }; } } }, extra: { emergencyScene } });
  failing.mural.start();
  await failing.clock.tick(0);
  failing.mural.hold({ sceneId: "emergencia", critical: true });
  await failing.clock.tick(1000);
  assert.equal(failing.mural.state().held, "emergencia", "falhou mas NÃO foi solta");
  assert.match(failing.text(), /EMERGENCIA/, "o HTML fixo de emergência segura a tela");
  broken = false;
  await failing.clock.tick(2000);
  assert.match(failing.text(), /VOLTOU/, "assim que a cena volta a funcionar ela assume");
  failing.mural.stop();
});

test("vigia com o rodízio parado: pausa não vira 'travou'; recarga preventiva e pendências esperam; pedido do moderador recarrega na hora", () => {
  const config = { maxConsecutiveFailures: 6, preventiveReloadMs: 7200000, reloadStormWindowMs: 600000, reloadStormMax: 3 };
  const base = { now: 8000000, startedAt: 0, beatDueAt: 9000000, atBoundary: true, pending: ["version"] };
  assert.equal(evaluateHealth({ ...base, held: false }, config).action, "reload", "sem pausa a recarga preventiva vale");
  assert.equal(evaluateHealth({ ...base, held: true }, config).action, "none", "parado numa cena ninguém recarrega por tempo ou versão");
  assert.equal(evaluateHealth({ ...base, held: true, now: 9000001 }, config).reason, "stuck", "mas travar de verdade continua valendo");
  const remote = evaluateHealth({ ...base, held: true, atBoundary: false, pending: [], urgent: ["remote-reload"] }, config);
  assert.deepEqual([remote.action, remote.reason], ["reload", "remote-reload"], "o moderador pediu: recarrega agora, fora da troca de cena");
  assert.equal(evaluateHealth({ ...base, urgent: ["remote-reload"], recentReloads: [7900000, 7910000, 7920000] }, config).action, "none", "a trava anti-laço também vale pro pedido remoto");
});

test("cena que sabe a própria duração (vídeo): o `seconds` do render manda no tempo de tela e no --scene-ms; sem ele vale o do dado", async () => {
  const timed = { render: (_p, params) => ({ markup: `<p>${params.label}</p>`, seconds: 4 }) };
  const { clock, mural, active, contentEl } = setup({ scenes: [okScene("v", { type: "timed", seconds: 30 }), okScene("b", { seconds: 10 })], registry: { timed } });
  mural.start();
  await clock.tick(0);
  assert.equal(active(), "v");
  assert.equal(contentEl.querySelector('[data-scene="v"]').style.getPropertyValue("--scene-ms"), "4000");
  await clock.tick(3900);
  assert.equal(active(), "v");
  await clock.tick(200);
  assert.equal(active(), "b", "saiu aos 4 s, não aos 30 s do dado");
  assert.equal(mural.state().current.endsAt - mural.state().current.startedAt, 10000, "a que não informa usa o do dado");
  mural.stop();
});
