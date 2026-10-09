/**
 * Controle remoto do mural (docs/js/features/mural-control.js): as regras do moderador (documento -> documento) e o aplicador do telão (documento -> ordens ao motor).
 *   node --test DevFestIA/tools/mural/control.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createFakeClock } = require("../lib/fake-clock.js");
const { emptyControl, normalizeControl, summarizeControl, addNotice, removeNotice, holdScene, releaseHold, armEmergency, disarmEmergency, orderReload, createMuralControl } = load("features/mural-control.js");

const limits = { maxNotices: 3, maxTextLength: 20, maxEmergencyLength: 30 };
const NOW = 1_000_000;
const MIN = 60_000;

test("normalizar: documento ausente ou torto vira vazio; aviso vencido, sem texto ou sem id some; texto é limpo e cortado; alerta só se for 'alert'", () => {
  assert.deepEqual(normalizeControl(null, NOW, limits), emptyControl());
  assert.deepEqual(normalizeControl({ notices: "x", emergency: 5, hold: "y" }, NOW, limits), emptyControl());
  const doc = { notices: [
    { id: "a", text: "  Sala   B começa em 5 minutos, venham todos  ", kind: "alert", until: NOW + MIN },
    { id: "b", text: "venceu", until: NOW - 1 },
    { id: "c", text: "   ", until: NOW + MIN },
    { text: "sem id", until: NOW + MIN },
    { id: "d", text: "ok", kind: "qualquer", until: NOW + MIN },
  ] };
  const state = normalizeControl(doc, NOW, limits);
  assert.deepEqual(state.notices.map(notice => [notice.id, notice.text, notice.kind]), [["a", "Sala B começa em 5 m", "alert"], ["d", "ok", "info"]]);
});

test("avisos: entram com validade, os mais antigos saem no limite, remover tira só aquele e aviso vazio é recusado", () => {
  let doc = emptyControl();
  doc = addNotice(doc, { text: "um", ttlMs: 5 * MIN, id: "1", nowMs: NOW }, limits);
  doc = addNotice(doc, { text: "dois", kind: "alert", ttlMs: 5 * MIN, id: "2", nowMs: NOW }, limits);
  doc = addNotice(doc, { text: "três", ttlMs: 5 * MIN, id: "3", nowMs: NOW }, limits);
  doc = addNotice(doc, { text: "quatro", ttlMs: 5 * MIN, id: "4", nowMs: NOW }, limits);
  assert.deepEqual(doc.notices.map(notice => notice.id), ["2", "3", "4"], "no limite de 3, o mais antigo saiu");
  assert.equal(doc.notices[0].until, NOW + 5 * MIN);
  assert.deepEqual(removeNotice(doc, "3", NOW, limits).notices.map(notice => notice.id), ["2", "4"]);
  assert.throws(() => addNotice(doc, { text: "   ", ttlMs: MIN, id: "x", nowMs: NOW }, limits), /escreva o aviso/);
  const later = addNotice(doc, { text: "novo", ttlMs: MIN, id: "5", nowMs: NOW + 10 * MIN }, limits);
  assert.deepEqual(later.notices.map(notice => notice.id), ["5"], "avisos vencidos são limpos a cada gravação");
});

test("fixar, pausar, soltar, emergência e recarregar: cada ordem mexe só no seu campo e as outras ficam", () => {
  let doc = addNotice(emptyControl(), { text: "aviso", ttlMs: 10 * MIN, id: "1", nowMs: NOW }, limits);
  doc = holdScene(doc, { sceneId: "agora", ttlMs: 15 * MIN, nowMs: NOW }, limits);
  assert.deepEqual(doc.hold, { sceneId: "agora", until: NOW + 15 * MIN });
  assert.equal(doc.notices.length, 1);
  doc = holdScene(doc, { ttlMs: 5 * MIN, nowMs: NOW }, limits);
  assert.deepEqual(doc.hold, { sceneId: null, until: NOW + 5 * MIN }, "sem cena = pausa na que estiver no ar");
  doc = armEmergency(doc, { text: "Evacuação: sigam as saídas", nowMs: NOW }, limits);
  assert.deepEqual(doc.emergency, { text: "Evacuação: sigam as saídas", since: NOW });
  assert.throws(() => armEmergency(doc, { text: " ", nowMs: NOW }, limits), /escreva o texto da emergência/);
  assert.equal(disarmEmergency(doc, NOW, limits).emergency, null);
  assert.equal(releaseHold(doc, NOW, limits).hold, null);
  assert.equal(orderReload(doc, NOW + 1, limits).reload, NOW + 1);
  assert.equal(normalizeControl(holdScene(emptyControl(), { sceneId: "a", ttlMs: MIN, nowMs: NOW }, limits), NOW + 2 * MIN, limits).hold, null, "fixar vence sozinho");
});

function setup({ read = null, limits: setupLimits = limits } = {}) {
  const clock = createFakeClock(NOW);
  const calls = [];
  const live = {};
  let stored = read;
  const mural = { hold: order => calls.push(["hold", order]), release: () => calls.push(["release"]), pushInterrupt: spec => calls.push(["interrupt", spec]) };
  const reloads = [];
  const spec = { emergencyScene: "emergencia", noticeInterrupt: { sceneId: "aviso", priority: 90, ttlMs: 60000, immediate: true } };
  const control = createMuralControl({ mural, live, limits: setupLimits, spec, nowMs: clock.nowMs, schedule: clock.schedule, requestReload: reason => reloads.push(reason), reloadStore: { read: () => stored, write: token => { stored = token; } } });
  return { control, calls, live, reloads, clock, stored: () => stored };
}
const doc = (extra = {}) => ({ notices: [], emergency: null, hold: null, reload: 0, ...extra });

test("aplicador: aviso novo entra na frente UMA vez, aparece em live.notices e some sozinho quando vence (sem ninguém remover)", async () => {
  const { control, calls, live, clock } = setup();
  control.apply(doc({ notices: [{ id: "1", text: "Achado e perdido", until: NOW + 5 * MIN }] }));
  assert.deepEqual(live.notices.map(notice => notice.text), ["Achado e perdido"]);
  assert.deepEqual(calls.filter(call => call[0] === "interrupt").length, 1);
  assert.equal(calls.find(call => call[0] === "interrupt")[1].sceneId, "aviso");
  control.apply(doc({ notices: [{ id: "1", text: "Achado e perdido", until: NOW + 5 * MIN }] }));
  assert.equal(calls.filter(call => call[0] === "interrupt").length, 1, "o mesmo aviso lido de novo não empurra outra interrupção");
  control.apply(doc({ notices: [{ id: "1", text: "Achado e perdido", until: NOW + 5 * MIN }, { id: "2", text: "Sala B em 5 min", until: NOW + 6 * MIN }] }));
  assert.equal(calls.filter(call => call[0] === "interrupt").length, 2, "aviso novo, interrupção nova");
  await clock.tick(5 * MIN + 100);
  assert.deepEqual(live.notices.map(notice => notice.id), ["2"], "o primeiro venceu e saiu sozinho");
  await clock.tick(2 * MIN);
  assert.equal(live.notices, undefined, "sem aviso vivo a lista some (a cena não entra no rodízio)");
});

test("aplicador: fixar e pausar mandam o motor parar; soltar manda seguir; a mesma ordem lida de novo não repete; a emergência vence a pausa e não vence sozinha", () => {
  const { control, calls, live } = setup();
  control.apply(doc({ hold: { sceneId: "agora", until: NOW + 10 * MIN } }));
  assert.deepEqual(calls[0], ["hold", { sceneId: "agora", untilMs: NOW + 10 * MIN, critical: false }]);
  control.apply(doc({ hold: { sceneId: "agora", until: NOW + 10 * MIN } }));
  assert.equal(calls.length, 1, "mesma ordem, nenhuma chamada nova");
  control.apply(doc({ hold: { sceneId: "agora", until: NOW + 10 * MIN }, emergency: { text: "Evacuar", since: NOW } }));
  assert.deepEqual(calls[1], ["hold", { sceneId: "emergencia", untilMs: Infinity, critical: true }], "emergência passa na frente da pausa");
  assert.equal(live.emergency.text, "Evacuar");
  control.apply(doc({ hold: { sceneId: "agora", until: NOW + 10 * MIN } }));
  assert.deepEqual(calls[2], ["hold", { sceneId: "agora", untilMs: NOW + 10 * MIN, critical: false }], "desarmou: volta a pausa que estava");
  assert.equal(live.emergency, undefined);
  control.apply(null);
  assert.deepEqual(calls[3], ["release"], "documento apagado solta tudo");
});

test("aplicador: aviso novo durante a emergência não corta a emergência; ao desarmar o aviso já está no rodízio", () => {
  const { control, calls, live } = setup();
  control.apply(doc({ emergency: { text: "Evacuar", since: NOW }, notices: [{ id: "1", text: "x", until: NOW + MIN }] }));
  assert.equal(calls.filter(call => call[0] === "interrupt").length, 0);
  control.apply(doc({ notices: [{ id: "1", text: "x", until: NOW + MIN }] }));
  assert.equal(calls.filter(call => call[0] === "interrupt").length, 0, "já era conhecido, não vira interrupção atrasada");
  assert.equal(live.notices.length, 1);
});

test("pausa vencida (relógio do telão passou do prazo) solta sozinha mesmo sem nova leitura do banco", async () => {
  const { control, calls, clock } = setup();
  control.apply(doc({ hold: { sceneId: null, until: NOW + MIN } }));
  assert.equal(calls[0][0], "hold");
  await clock.tick(MIN + 100);
  assert.deepEqual(calls[calls.length - 1], ["release"]);
});

test("recarregar: o primeiro valor visto é só o ponto de partida; valor novo pede recarga UMA vez e o valor fica guardado (sobrevive à recarga, sem laço)", () => {
  const { control, reloads, stored } = setup();
  control.apply(doc({ reload: 111 }));
  assert.deepEqual(reloads, [], "mural recém-aberto não recarrega por um pedido antigo");
  assert.equal(stored(), 111);
  control.apply(doc({ reload: 111 }));
  assert.deepEqual(reloads, []);
  control.apply(doc({ reload: 222 }));
  assert.deepEqual(reloads, ["remote-reload"]);
  assert.equal(stored(), 222);
  control.apply(doc({ reload: 222 }));
  assert.deepEqual(reloads, ["remote-reload"], "depois de recarregar (valor guardado) o mesmo pedido não repete");
  const afterReload = setup({ read: 222 });
  afterReload.control.apply(doc({ reload: 333 }));
  assert.deepEqual(afterReload.reloads, ["remote-reload"], "pedido que chegou enquanto a página recarregava não se perde");
});

test("resumo do estado: telão normal, pausado, fixado numa cena e emergência, com a contagem de avisos (o mesmo texto do painel e da visão geral do admin)", () => {
  const labels = { agora: "Agora e próximas" };
  const options = { sceneLabel: id => labels[id] ?? id, formatTime: ms => `t${ms}` };
  assert.deepEqual(summarizeControl(emptyControl(), options), { emergency: false, headline: "Telão normal", holdText: "rodando sozinho", noticeCount: 0, text: "Telão normal · rodando sozinho · 0 aviso(s) no ar" });
  const paused = normalizeControl({ hold: { sceneId: null, until: NOW + MIN }, notices: [{ id: "a", text: "oi", until: NOW + MIN }] }, NOW, limits);
  assert.equal(summarizeControl(paused, options).text, `Telão normal · pausado até t${NOW + MIN} · 1 aviso(s) no ar`);
  const pinned = normalizeControl({ hold: { sceneId: "agora", until: NOW + MIN } }, NOW, limits);
  assert.match(summarizeControl(pinned, options).holdText, /^fixo em "Agora e próximas" até /);
  const emergency = normalizeControl({ emergency: { text: "saiam", since: 1 } }, NOW, limits);
  assert.deepEqual([summarizeControl(emergency, options).emergency, summarizeControl(emergency, options).headline], [true, "EMERGÊNCIA ARMADA"]);
  assert.equal(summarizeControl(emptyControl()).holdText, "rodando sozinho", "sem opções também funciona");
});

test("tipos de aviso: os de `limits.kinds` valem (frase, contagem, pausa), outro vira aviso comum e sem `kinds` só aviso e alerta existem", () => {
  const kinded = { ...limits, kinds: ["info", "alert", "quote", "countdown", "break"] };
  let doc = emptyControl();
  for (const kind of ["quote", "countdown", "break", "outro"]) doc = addNotice(doc, { text: kind, kind, ttlMs: 5 * MIN, id: kind, nowMs: NOW }, { ...kinded, maxNotices: 10 });
  assert.deepEqual(normalizeControl(doc, NOW, { ...kinded, maxNotices: 10 }).notices.map(notice => [notice.id, notice.kind]), [["quote", "quote"], ["countdown", "countdown"], ["break", "break"], ["outro", "info"]]);
  const plain = normalizeControl({ notices: [{ id: "q", text: "frase", kind: "quote", until: NOW + MIN }] }, NOW, limits);
  assert.equal(plain.notices[0].kind, "info", "sem `kinds` no limite, o tipo novo cai em aviso");
  assert.equal(addNotice(emptyControl(), { text: "x", kind: "countdown", ttlMs: MIN, id: "c", nowMs: NOW }, kinded).notices[0].until, NOW + MIN, "contagem: o `until` é a hora do acontecimento");
});

test("aplicador: um tipo de aviso de `limits.liveByKind` liga a fonte `live` enquanto o aviso está vivo e desliga quando ele vence ou sai (a pausa liga o quebra-gelo)", async () => {
  const { control, live, clock } = setup({ limits: { ...limits, kinds: ["info", "break"], liveByKind: { break: "break" } } });
  control.apply(doc({ notices: [{ id: "p", text: "Pausa para o café", kind: "break", until: NOW + 10 * MIN }, { id: "i", text: "aviso comum", kind: "info", until: NOW + 30 * MIN }] }));
  assert.equal(live.break, true);
  await clock.tick(10 * MIN + 100);
  assert.equal(live.break, undefined, "a pausa venceu: o quebra-gelo sai do ar");
  assert.deepEqual(live.notices.map(notice => notice.id), ["i"]);
  control.apply(doc({ notices: [{ id: "p2", text: "Pausa", kind: "break", until: clock.nowMs() + 5 * MIN }] }));
  assert.equal(live.break, true);
  control.apply(doc());
  assert.equal(live.break, undefined, "pausa removida pelo moderador");
});
