/**
 * Testes de TELA do moderador do controle do mural (docs/js/features/mural-control-panel.js): login, aviso com frases prontas e validade, remover aviso, fixar e pausar, recarregar,
 * emergência em dois toques, permissão negada e a regra de não apagar o que a pessoa está digitando. Login e banco são de mentira (nada toca o Firebase).
 *   node --test DevFestIA/tools/dom/mural-control-panel.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/mock-links.js", "data/mock-photo.js", "data/mock-speakers.js", "data/mock-talks.js", "data/schedule-builder.js", "data/schedule.js", "data/mural-config.js", "data/wall-config.js", "data/mural-scenes.js", "data/mural-notices.js", "components/moderator-login.js", "components/mural-control-panel.js", "features/moderator-login.js", "features/mural-control.js", "features/two-tap-confirm.js", "features/mural-control-panel.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const limits = g("MURAL_CONFIG").control;
const RULE_NAMES = { normalizeControl: "normalize", summarizeControl: "summarize" };
const rules = ["normalizeControl", "summarizeControl", "addNotice", "removeNotice", "holdScene", "releaseHold", "armEmergency", "disarmEmergency", "orderReload"].reduce((all, name) => ({ ...all, [RULE_NAMES[name] ?? name]: g(name) }), {});
const scenes = [{ id: "agora", label: "Agora e próximas" }, { id: "dicas", label: "Dicas" }];
const templates = { notice: ["A próxima palestra começa em 5 minutos"], emergency: ["Evacuação: sigam as saídas de emergência com calma"], announce: [{ label: "Foto da galera", kind: "countdown", text: "Foto da galera: venham para perto" }, { label: "Pausa para o café", kind: "break", text: "Pausa para o café" }], kinds: g("muralNoticeTemplatesRepository").getAll().kinds };

function setup({ email = "mod@gmail.com", initial = null, setImpl } = {}) {
  document.body.innerHTML = `<main id="modBody"></main>`;
  const clock = createFakeClock(1_700_000_000_000);
  const writes = [];
  const listeners = [];
  let ids = 0;
  const repository = {
    listen: (key, onNext, onError) => { listeners.push({ key, onNext, onError }); onNext(initial); return () => listeners.pop(); },
    set: setImpl ?? (async (key, data) => { writes.push({ key, data }); }),
  };
  const login = { signIn: async () => email, restore: async () => null, signOut: async () => {} };
  const rootEl = document.getElementById("modBody");
  g("initMuralControlPanel")(rootEl, { repository, rules, limits, scenes, templates, login, nowMs: clock.nowMs, makeId: () => `id${++ids}`, schedule: clock.schedule, formatTime: date => `${date.getUTCHours()}h`, whenReady: task => task() });
  const click = selector => rootEl.querySelector(selector).click();
  return { rootEl, clock, writes, listeners, click, signIn: async () => { click("[data-mod-signin]"); await waitFor(() => rootEl.querySelector("[data-notice-publish]")); } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const NOW = 1_700_000_000_000;

test("sem login: só o convite pra entrar com Google; não lê o banco", () => {
  const { rootEl, listeners } = setup();
  assert.ok(rootEl.querySelector("[data-mod-signin]"));
  assert.equal(rootEl.querySelector("[data-notice-publish]"), null);
  assert.equal(listeners.length, 0);
});

test("entrar: mostra a conta, o estado normal do telão, as frases prontas, as durações do dado e as cenas que dá pra fixar", async () => {
  const { rootEl, signIn } = setup();
  await signIn();
  assert.match(textOf(rootEl), /mod@gmail\.com/);
  assert.match(textOf(rootEl.querySelector("[data-slot=status]")), /Telão normal · rodando sozinho · 0 aviso\(s\) no ar/);
  assert.match(textOf(rootEl), /A próxima palestra começa em 5 minutos/);
  assert.deepEqual([...rootEl.querySelectorAll("[data-notice-minutes]")].map(button => textOf(button)), ["1 min", "2 min", "5 min", "10 min", "15 min", "1 h"]);
  assert.deepEqual([...rootEl.querySelectorAll("[data-hold-scene] option")].map(option => option.textContent), ["Agora e próximas", "Dicas"]);
  assert.equal(rootEl.querySelector("[data-notice-text]").getAttribute("maxlength"), String(limits.maxTextLength));
});

test("aviso: a frase pronta preenche o campo, publica com tipo e validade escolhidos, limpa o campo e aparece na lista com opção de remover", async () => {
  const { rootEl, writes, click, signIn } = setup();
  await signIn();
  click("[data-notice-template]");
  assert.equal(rootEl.querySelector("[data-notice-text]").value, "A próxima palestra começa em 5 minutos");
  click('[data-notice-kind="alert"]');
  click('[data-notice-minutes="15"]');
  click("[data-notice-publish]");
  await waitFor(() => writes.length === 1);
  const notice = writes[0].data.notices[0];
  assert.deepEqual([writes[0].key, notice.text, notice.kind, notice.until, notice.id], ["current", "A próxima palestra começa em 5 minutos", "alert", NOW + 15 * 60000, "id1"]);
  await waitFor(() => /Aviso publicado no telão/.test(textOf(rootEl)));
  assert.equal(rootEl.querySelector("[data-notice-text]").value, "", "campo limpo depois de publicar");
  assert.match(textOf(rootEl.querySelector("[data-slot=notices]")), /A próxima palestra começa em 5 minutos/);
  click("[data-notice-remove]");
  await waitFor(() => writes.length === 2);
  assert.deepEqual([...writes[1].data.notices], []);
});

test("aviso vazio é recusado na tela (sem gravar); a estado que chega do banco NÃO apaga o texto que a pessoa está digitando", async () => {
  const { rootEl, writes, listeners, click, signIn } = setup();
  await signIn();
  click("[data-notice-publish]");
  assert.match(textOf(rootEl), /Escreva o aviso\./);
  assert.equal(writes.length, 0);
  const input = rootEl.querySelector("[data-notice-text]");
  input.value = "texto pela metade";
  listeners[0].onNext({ notices: [], emergency: null, hold: null, reload: 0 }); // outro moderador mexeu
  assert.equal(rootEl.querySelector("[data-notice-text]"), input, "o mesmo campo, não redesenhado");
  assert.equal(input.value, "texto pela metade");
});

test("fixar e pausar: gravam com a duração escolhida (a cena do seletor ou nenhuma = pausa); o estado mostra e dá pra soltar", async () => {
  const { rootEl, writes, click, signIn, listeners } = setup();
  await signIn();
  click('[data-hold-minutes="30"]');
  rootEl.querySelector("[data-hold-scene]").value = "dicas";
  click("[data-hold-pin]");
  await waitFor(() => writes.length === 1);
  assert.deepEqual({ ...writes[0].data.hold }, { sceneId: "dicas", until: NOW + 30 * 60000 });
  await waitFor(() => /Cena fixada no telão/.test(textOf(rootEl)), { timeout: 3000 }); // espera o banco confirmar (enquanto grava, outro toque é ignorado)
  assert.match(textOf(rootEl.querySelector("[data-slot=status]")), /fixo em "Dicas" até/);
  click("[data-hold-pause]");
  await waitFor(() => writes.length === 2);
  assert.deepEqual({ ...writes[1].data.hold }, { sceneId: null, until: NOW + 30 * 60000 });
  await waitFor(() => /Telão pausado/.test(textOf(rootEl)));
  assert.match(textOf(rootEl.querySelector("[data-slot=status]")), /pausado até/);
  click("[data-hold-release]");
  await waitFor(() => writes.length === 3);
  assert.equal(writes[2].data.hold, null);
  assert.ok(listeners.length === 1);
});

test("recarregar o mural: grava um número novo de pedido (o mural compara com o último que viu)", async () => {
  const { rootEl, writes, click, signIn } = setup();
  await signIn();
  click("[data-reload]");
  await waitFor(() => writes.length === 1);
  assert.equal(writes[0].data.reload, NOW);
  await waitFor(() => /Pedido enviado/.test(textOf(rootEl)));
});

test("EMERGÊNCIA: sem texto não arma; o 1º toque só pede confirmação (e a confirmação expira); o 2º arma; desarmar é um toque", async () => {
  const { rootEl, writes, clock, click, signIn } = setup();
  await signIn();
  click("[data-emergency-arm]");
  assert.match(textOf(rootEl), /Escreva o texto da emergência/);
  click("[data-emergency-template]");
  assert.match(rootEl.querySelector("[data-emergency-text]").value, /Evacuação/);
  click("[data-emergency-arm]");
  assert.equal(writes.length, 0, "o primeiro toque não grava");
  assert.match(textOf(rootEl.querySelector("[data-slot=emergency]")), /Toque de novo para CONFIRMAR/);
  await clock.tick(6000);
  assert.match(textOf(rootEl.querySelector("[data-slot=emergency]")), /Armar emergência/, "passou o prazo: volta ao primeiro toque");
  click("[data-emergency-arm]");
  click("[data-emergency-arm]");
  await waitFor(() => writes.length === 1);
  assert.deepEqual({ ...writes[0].data.emergency }, { text: "Evacuação: sigam as saídas de emergência com calma", since: NOW + 6000 });
  await waitFor(() => /EMERGÊNCIA ARMADA no telão/.test(textOf(rootEl)));
  assert.match(textOf(rootEl.querySelector("[data-slot=status]")), /EMERGÊNCIA ARMADA/);
  assert.match(textOf(rootEl.querySelector("[data-slot=emergency]")), /Evacuação.*Desarmar emergência/);
  click("[data-emergency-disarm]");
  await waitFor(() => writes.length === 2);
  assert.equal(writes[1].data.emergency, null);
});

test("sem permissão (conta que não é moderadora) e erro de rede: a tela avisa e volta ao que o banco tinha", async () => {
  const denied = setup({ setImpl: async () => { throw Object.assign(new Error("x"), { code: "permission-denied" }); } });
  await denied.signIn();
  denied.rootEl.querySelector("[data-notice-text]").value = "teste";
  denied.click("[data-notice-publish]");
  await waitFor(() => /Sem permissão: esta conta não é de moderador/.test(textOf(denied.rootEl)));
  assert.match(textOf(denied.rootEl.querySelector("[data-slot=notices]")), /Nenhum aviso no ar/, "o aviso não ficou na lista");
  const offline = setup({ setImpl: async () => { throw new Error("offline"); } });
  await offline.signIn();
  offline.click("[data-reload]");
  await waitFor(() => /Não consegui salvar/.test(textOf(offline.rootEl)));
});

test("avisos que vencem somem da lista sozinhos (a tela se atualiza de tempos em tempos) e o estado do banco aparece na hora", async () => {
  const { rootEl, clock, listeners, signIn } = setup();
  await signIn();
  listeners[0].onNext({ notices: [{ id: "x", text: "Chave azul no achado e perdido", kind: "info", until: NOW + 60000 }], emergency: null, hold: null, reload: 0 });
  assert.match(textOf(rootEl.querySelector("[data-slot=notices]")), /Chave azul/);
  await clock.tick(60000 + 15000);
  assert.match(textOf(rootEl.querySelector("[data-slot=notices]")), /Nenhum aviso no ar/);
});

test("dentro da área de admin (embedded): sem porta de entrada, conta nem título; já lê o estado do telão e stop() desliga a escuta e o relógio", async () => {
  document.body.innerHTML = `<main id="modBody"></main>`;
  const clock = createFakeClock(NOW);
  const listeners = [];
  const rootEl = document.getElementById("modBody");
  const view = g("initMuralControlPanel")(rootEl, {
    repository: { listen: (key, onNext) => { listeners.push(key); onNext(null); return () => listeners.pop(); }, set: async () => {} },
    rules, limits, scenes, templates, nowMs: clock.nowMs, schedule: clock.schedule, formatTime: () => "", whenReady: task => task(), embedded: true,
  });
  assert.equal(rootEl.querySelector("[data-mod-signin]"), null);
  assert.equal(rootEl.querySelector(".mod-title"), null);
  assert.equal(rootEl.querySelector(".mod-account"), null);
  assert.ok(rootEl.querySelector("[data-notice-publish]"));
  assert.match(textOf(rootEl.querySelector("[data-slot=status]")), /Telão normal/);
  assert.deepEqual(listeners, [limits.docKey]);
  view.stop();
  assert.equal(listeners.length, 0, "parou de escutar o banco");
});

test("os parâmetros padrão do painel (mural-controle.html e admin) juntam repository, regras, limites, cenas e frases prontas do site", () => {
  const window2 = site.window;
  window2.moderationMuralControlRepository = { listen() {}, set() {} };
  const deps = g("defaultMuralControlPanelDeps")();
  assert.equal(deps.repository, window2.moderationMuralControlRepository);
  assert.deepEqual(Object.keys(deps.rules).sort(), ["addNotice", "armEmergency", "disarmEmergency", "holdScene", "normalize", "orderReload", "releaseHold", "removeNotice", "summarize"]);
  assert.equal(deps.limits.docKey, "current");
});

test("anúncio ao vivo: o botão pronto escolhe o tipo, escreve o texto e troca o texto de ajuda do campo e o rótulo do tempo; publicar grava o tipo com a hora do acontecimento", async () => {
  const { rootEl, writes, click, signIn } = setup();
  await signIn();
  assert.deepEqual([...rootEl.querySelectorAll("[data-notice-kind]")].map(button => textOf(button)), ["Aviso", "Alerta", "Frase", "Contagem", "Pausa"]);
  assert.match(textOf(rootEl.querySelector("[data-slot=durations]")), /^Fica no ar:/);
  click("[data-notice-quick=\"0\"]");
  assert.equal(rootEl.querySelector("[data-notice-text]").value, "Foto da galera: venham para perto");
  assert.match(rootEl.querySelector("[data-notice-text]").placeholder, /O que vai acontecer/);
  assert.match(textOf(rootEl.querySelector("[data-slot=durations]")), /^Acontece em:/);
  assert.ok(rootEl.querySelector('[data-notice-kind="countdown"]').classList.contains("chip-btn--primary"));
  click('[data-notice-minutes="10"]');
  click("[data-notice-publish]");
  await settle();
  assert.equal(writes.length, 1);
  assert.deepEqual([writes[0].data.notices[0].kind, writes[0].data.notices[0].until - NOW], ["countdown", 10 * 60000]);
  assert.match(textOf(rootEl.querySelector("[data-slot=notices]")), /Contagem · às/);
});

test("anúncio ao vivo: a pausa vira aviso do tipo pausa; trocar o tipo na mão muda o texto de ajuda; o tipo comum não mostra o rótulo na lista", async () => {
  const { rootEl, writes, click, signIn } = setup();
  await signIn();
  click("[data-notice-quick=\"1\"]");
  assert.equal(rootEl.querySelector("[data-notice-text]").value, "Pausa para o café");
  assert.match(textOf(rootEl.querySelector("[data-slot=durations]")), /^A pausa dura:/);
  click("[data-notice-publish]");
  await settle();
  assert.equal(writes[0].data.notices[0].kind, "break");
  click('[data-notice-kind="quote"]');
  assert.match(rootEl.querySelector("[data-notice-text]").placeholder, /frase marcante/);
  rootEl.querySelector("[data-notice-text]").value = "Uma frase";
  click('[data-notice-kind="info"]');
  click("[data-notice-publish]");
  await settle();
  assert.equal(writes[1].data.notices.at(-1).kind, "info");
  assert.doesNotMatch(textOf(rootEl.querySelector("[data-slot=notices]")).split("Uma frase")[1] ?? "", /Aviso ·/);
});
