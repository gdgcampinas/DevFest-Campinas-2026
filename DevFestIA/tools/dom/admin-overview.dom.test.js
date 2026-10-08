/**
 * Testes de TELA da visão geral do admin (docs/js/features/admin-overview.js, admin-overview-cards.js, admin-talks.js, components/admin-overview.js): a palestra de cada trilha, cada cartão com
 * repositories de mentira (telão, salas, perguntas pendentes, fotos, inscritos), um cartão que falha sem derrubar os outros e o desligamento de tudo. Nada toca o Firebase.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-overview.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({
  scripts: [...SITE_BASE, "features/scheduler.js", "data/mock-links.js", "data/mock-photo.js", "data/mock-speakers.js", "data/mock-talks.js", "data/schedule-builder.js", "data/schedule.js", "data/favorites.js", "data/talk-questions.js", "data/mural-config.js",
    "features/agenda.js", "features/live-status.js", "features/talk-index.js", "features/moderation-talk.js", "features/mural-live-sources.js", "features/mural-control.js", "data/admin-sections.js", "features/admin-talks.js",
    "components/admin-overview.js", "features/admin-overview.js", "features/admin-overview-cards.js"],
});
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const SCHEDULE = g("SCHEDULE");
const TRACKS = g("TRACKS");
const EVENT = g("EVENT");
const limits = g("MURAL_CONFIG").control;
const definitions = Object.fromEntries(g("adminOverviewRepository").getAll().map(definition => [definition.id, definition]));
const codeOf = (slot, trackId) => g("talkShareCode")(slot, trackId, EVENT.timezone);
const hasContest = g("talkHighlightsRepository").hasContest;
const allowsQuestions = g("talkHighlightsRepository").allowsQuestions;
const talkSlots = SCHEDULE.filter(slot => slot.talks);
const at = iso => new Date(iso);
const BEFORE = at("2026-11-28T10:00:00Z");
const FIRST_TALK = at("2026-11-28T12:10:00Z"); // 09:10 locais, 1ª palestra no ar
const JAM = at("2026-11-28T13:40:00Z"); // 10:40 locais, Coding Jam no ar (trilha IA)
const LUNCH = at("2026-11-28T15:30:00Z");
const AFTER = at("2026-11-28T21:00:00Z");
const formatTime = value => `h${new Date(value).toISOString().slice(11, 16)}`;

const describe = now => g("describeTrackTalks")({ schedule: SCHEDULE, tracks: TRACKS, now, codeOf, hasContest });

test("palestra por trilha: antes do evento é a próxima; durante, a que está no ar; no almoço, a próxima; depois do fim, nenhuma", () => {
  assert.deepEqual(describe(BEFORE).map(room => room.phase), TRACKS.map(() => "next"));
  assert.equal(describe(BEFORE)[0].talk.start.getTime(), talkSlots[0].start.getTime());
  assert.deepEqual(describe(FIRST_TALK).map(room => room.phase), TRACKS.map(() => "live"));
  assert.equal(describe(FIRST_TALK)[0].talk.title, talkSlots[0].talks.ia.title);
  assert.deepEqual(describe(LUNCH).map(room => room.phase), TRACKS.map(() => "next"));
  assert.equal(describe(LUNCH)[0].talk.start.getTime(), talkSlots.find(slot => slot.start > LUNCH).start.getTime());
  const after = describe(AFTER);
  assert.deepEqual(after.map(room => [room.phase, room.talk]), TRACKS.map(() => ["none", null]));
});

test("palestra por trilha: o código curto é o mesmo do site e o concurso (Coding Jam) aparece só na trilha que o tem, no ar ou não", () => {
  const room = describe(FIRST_TALK)[0];
  assert.equal(room.talk.code, codeOf(talkSlots[0], "ia"));
  const jamSlot = talkSlots.find(slot => slot.talks.ia.highlight === "codejam");
  const [ia, ...others] = describe(FIRST_TALK);
  assert.equal(ia.contest.code, codeOf(jamSlot, "ia"));
  assert.equal(ia.contest.title, jamSlot.talks.ia.title);
  assert.ok(others.every(other => other.contest === null));
  assert.equal(describe(JAM)[0].talk.code, ia.contest.code, "durante o Jam a palestra no ar é o próprio Jam");
});

function control({ initial = null, clock = createFakeClock(JAM.getTime()) } = {}) {
  const listeners = [];
  const repository = { listen: (key, onNext, onError) => { listeners.push({ key, onNext, onError }); onNext(initial); return () => listeners.splice(0, 1); } };
  const rules = { normalize: g("normalizeControl"), summarize: g("summarizeControl") };
  const card = g("createAdminControlCard")({ definition: definitions.control, controlRepository: repository, ...rules, limits, sceneLabel: id => `cena ${id}`, formatTime, nowMs: clock.nowMs, timer: clock.schedule });
  return { card, clock, listeners };
}

test("cartão do telão: normal sem aviso; com emergência vira alerta vermelho; pausa e fixação aparecem em palavras; aviso vencido sai da conta sem o banco mandar nada", async () => {
  const clock = createFakeClock(JAM.getTime());
  const now = clock.nowMs();
  const { card } = control({ initial: { notices: [{ id: "a", text: "oi", until: now + 60000 }], hold: { sceneId: "agora", until: now + 600000 }, emergency: null }, clock });
  const views = [];
  const stop = card(view => views.push({ ...view, lines: [...view.lines] }), () => {});
  assert.deepEqual(views.at(-1), { headline: "Telão normal", tone: "ok", lines: [`fixo em "cena agora" até ${formatTime(now + 600000)}`, "1 aviso(s) no ar"] });
  await clock.tick(definitions.control.refreshMs * 5);
  assert.equal(views.at(-1).lines[1], "0 aviso(s) no ar", "o aviso de 1 minuto venceu");
  stop();
  const emergency = control({ initial: { emergency: { text: "saiam", since: 1 } } });
  const emergencyViews = [];
  emergency.card(view => emergencyViews.push(view), () => {});
  assert.deepEqual([emergencyViews.at(-1).headline, emergencyViews.at(-1).tone], ["EMERGÊNCIA ARMADA", "danger"]);
});

test("cartão do telão: não desenha antes de o banco responder, repassa o erro da escuta e stop desliga a escuta e o relógio", async () => {
  const clock = createFakeClock(JAM.getTime());
  const listeners = [];
  const repository = { listen: (key, onNext, onError) => { listeners.push({ key, onNext, onError }); return () => listeners.pop(); } };
  const card = g("createAdminControlCard")({ definition: definitions.control, controlRepository: repository, normalize: g("normalizeControl"), summarize: g("summarizeControl"), limits, sceneLabel: id => id, formatTime, nowMs: clock.nowMs, timer: clock.schedule });
  const views = [];
  const errors = [];
  const stop = card(view => views.push(view), error => errors.push(error.message));
  assert.equal(views.length, 0, "ainda sem resposta do banco: nada de 'telão normal' falso");
  listeners[0].onError(new Error("sem permissão"));
  assert.deepEqual(errors, ["sem permissão"]);
  stop();
  assert.equal(listeners.length, 0);
  assert.equal(clock.pending(), 0);
});

test("cartão das salas: uma linha por trilha com o estado e o horário, conta as que estão no ar e acompanha o relógio", async () => {
  const clock = createFakeClock(FIRST_TALK.getTime());
  const nowFn = () => new Date(clock.nowMs());
  const card = g("createAdminRoomsCard")({ definition: definitions.rooms, schedule: SCHEDULE, tracks: TRACKS, now: nowFn, codeOf, hasContest, formatTime, timer: clock.schedule });
  const views = [];
  const stop = card(view => views.push({ ...view, lines: [...view.lines] }), () => {});
  assert.equal(views.at(-1).headline, `${TRACKS.length} de ${TRACKS.length} com palestra no ar`);
  assert.equal(views.at(-1).lines[0], `${TRACKS[0].shortLabel}: no ar, ${talkSlots[0].talks.ia.title} (${formatTime(talkSlots[0].start)})`);
  await clock.tick(AFTER.getTime() - FIRST_TALK.getTime() + definitions.rooms.refreshMs);
  assert.equal(views.at(-1).headline, `0 de ${TRACKS.length} com palestra no ar`);
  assert.ok(views.at(-1).lines.every(line => /sem palestra$/.test(line)));
  stop();
});

function pending({ now = FIRST_TALK, countImpl } = {}) {
  const clock = createFakeClock(now.getTime());
  const asked = [];
  const questionsRepository = { countWhere: countImpl ?? (async filters => { asked.push(filters); return filters.talkKey.endsWith("|ia") ? 3 : 1; }) };
  const card = g("createAdminPendingQuestionsCard")({ definition: definitions.pending, schedule: SCHEDULE, tracks: TRACKS, now: () => new Date(clock.nowMs()), allowsQuestions, questionsRepository, pendingStatus: g("QUESTION_STATUS").pending, pickTalk: g("pickModerationTalk"), timer: clock.schedule });
  return { card, clock, asked };
}

test("cartão de perguntas pendentes: conta por trilha só as 'pending' da palestra da sala, soma tudo e relê no ritmo do dado", async () => {
  const { card, clock, asked } = pending();
  const views = [];
  const stop = card(view => views.push({ ...view, lines: [...view.lines] }), () => {});
  await waitFor(() => views.length === 1);
  assert.equal(asked.length, TRACKS.length);
  assert.ok(asked.every(filters => filters.status === "pending"));
  assert.deepEqual([...asked.map(filters => filters.talkKey)], [...TRACKS.map(track => g("talkKey")(talkSlots[0], track.id))]);
  assert.equal(views[0].headline, "6 na fila", "3 da IA + 1 de cada uma das outras três");
  assert.equal(views[0].tone, "warn");
  assert.equal(views[0].lines[0], `${TRACKS[0].shortLabel}: 3 pendente(s)`);
  await clock.tick(definitions.pending.intervalMs + 10);
  await waitFor(() => views.length >= 2);
  stop();
});

test("cartão de perguntas pendentes: sala sem palestra, sessão com perguntas desligadas (Coding Jam) e leitura que falha numa trilha só aparecem na linha da trilha", async () => {
  const jam = pending({ now: JAM });
  const jamViews = [];
  jam.card(view => jamViews.push(view), () => {});
  await waitFor(() => jamViews.length === 1);
  assert.equal(jamViews[0].lines[0], `${TRACKS[0].shortLabel}: perguntas desligadas nesta sessão`);
  assert.equal(jam.asked.length, TRACKS.length - 1, "a trilha do Jam nem é consultada");
  const before = pending({ now: BEFORE });
  const beforeViews = [];
  before.card(view => beforeViews.push(view), () => {});
  await waitFor(() => beforeViews.length === 1);
  assert.ok(beforeViews[0].lines.every(line => /sem palestra$/.test(line)));
  assert.equal(beforeViews[0].headline, "0 na fila");
  const flaky = pending({ countImpl: async filters => { if (filters.talkKey.includes("mobile")) throw new Error("sem rede"); return 2; } });
  const flakyViews = [];
  flaky.card(view => flakyViews.push(view), () => {});
  await waitFor(() => flakyViews.length === 1);
  assert.ok(flakyViews[0].lines.some(line => /não consegui ler$/.test(line)));
  assert.ok(flakyViews[0].lines.some(line => /2 pendente/.test(line)), "as outras trilhas seguem");
});

function photos({ total = 40, hidden = { ids: ["a", "b"] }, albumFails = false } = {}) {
  const clock = createFakeClock(JAM.getTime());
  const hiddenListeners = [];
  const albumsRepository = { get: async () => { if (albumFails) throw new Error("sem rede"); return { photos: Array.from({ length: total }, (_, index) => ({ id: `p${index}` })) }; } };
  const hiddenRepository = { listen: (id, onNext, onError) => { hiddenListeners.push({ id, onNext, onError }); if (hidden) onNext(hidden); return () => hiddenListeners.pop(); } };
  const card = g("createAdminPhotosCard")({ definition: definitions.photos, album: { id: "ao-vivo", label: "ao vivo" }, albumsRepository, hiddenRepository, timer: clock.schedule });
  return { card, clock, hiddenListeners };
}

test("cartão de fotos: total do álbum e quantas estão fora do ar; cada metade falha sozinha; stop desliga a escuta e o polling", async () => {
  const ok = photos();
  const views = [];
  const stop = ok.card(view => views.push({ ...view, lines: [...view.lines] }), () => {});
  await waitFor(() => views.at(-1)?.headline === "40 foto(s)");
  assert.deepEqual(views.at(-1), { headline: "40 foto(s)", tone: "ok", lines: ["Álbum: ao vivo", "Fora do ar: 2"] });
  assert.deepEqual(ok.hiddenListeners.map(listener => listener.id), ["ao-vivo"]);
  stop();
  assert.equal(ok.hiddenListeners.length, 0);
  assert.equal(ok.clock.pending(), 0);
  const broken = photos({ albumFails: true });
  const brokenViews = [];
  broken.card(view => brokenViews.push({ ...view, lines: [...view.lines] }), () => {});
  await waitFor(() => brokenViews.at(-1)?.headline === "não consegui ler foto(s)");
  assert.equal(brokenViews.at(-1).tone, "warn");
  assert.equal(brokenViews.at(-1).lines[1], "Fora do ar: 2", "a lista de fotos fora do ar continua valendo");
});

test("cartão de fotos: sem álbum ao vivo configurado (intermediário desligado) pede o aviso de erro do cartão", () => {
  const errors = [];
  const card = g("createAdminPhotosCard")({ definition: definitions.photos, album: null, albumsRepository: null, hiddenRepository: {}, timer: createFakeClock().schedule });
  card(() => assert.fail("não deveria desenhar"), error => errors.push(error.message));
  assert.deepEqual(errors, ["álbum ao vivo não configurado"]);
});

test("cartão de inscritos: espera o login anônimo, mostra o total da edição e avisa quando o Sympla ainda não gravou nada", async () => {
  const order = [];
  const clock = createFakeClock(JAM.getTime());
  const make = stats => g("createAdminRegisteredCard")({ definition: definitions.registered, statsRepository: { get: async edition => { order.push(`get:${edition}`); return stats; } }, edition: "2026", getUid: async () => { order.push("uid"); }, timer: clock.schedule });
  const views = [];
  make({ total: 321 })(view => views.push({ ...view, lines: [...view.lines] }), () => {});
  await waitFor(() => views.length === 1);
  assert.deepEqual(order, ["uid", "get:2026"]);
  assert.deepEqual(views[0], { headline: "321", lines: ["inscritos (Sympla)"] });
  const empty = [];
  make(null)(view => empty.push(view), () => {});
  await waitFor(() => empty.length === 1);
  assert.deepEqual([empty[0].headline, empty[0].tone], ["sem dado", "warn"]);
});

test("montagem dos cartões: segue a ordem do dado e ignora definição sem fábrica", () => {
  const cards = g("buildAdminOverviewCards")({
    definitions: [{ id: "b", title: "B" }, { id: "nada", title: "?" }, { id: "a", title: "A" }],
    factories: { a: () => () => () => {}, b: () => () => () => {} },
    deps: {},
  });
  assert.deepEqual(cards.map(card => card.id), ["b", "a"]);
  assert.deepEqual(cards.map(card => card.title), ["B", "A"]);
});

test("visão geral: um cartão por definição, cada um no seu espaço; um que dá erro (ou lança) só avisa no próprio espaço; stop desliga todos", () => {
  document.body.innerHTML = `<div id="view"></div>`;
  const stopped = [];
  const cards = [
    { id: "ok", title: "Bom", watch: onView => { onView({ headline: "42", tone: "ok", lines: ["linha <b>x</b>"] }); return () => stopped.push("ok"); } },
    { id: "erro", title: "Ruim", watch: (onView, onError) => { onError(new Error("x")); return () => stopped.push("erro"); } },
    { id: "lanca", title: "Quebrado", watch: () => { throw new Error("boom"); } },
    { id: "carregando", title: "Lento", watch: () => () => stopped.push("carregando") },
  ];
  const warn = console.warn;
  console.warn = () => {};
  const view = g("initAdminOverview")(document.getElementById("view"), { cards });
  console.warn = warn;
  const body = id => document.querySelector(`[data-card-body="${id}"]`);
  assert.deepEqual([...document.querySelectorAll("[data-card] h2")].map(title => textOf(title)), ["Bom", "Ruim", "Quebrado", "Lento"]);
  assert.match(textOf(body("ok")), /^42\s*linha <b>x<\/b>$/);
  assert.equal(body("ok").querySelector("b"), null, "texto escapado");
  assert.ok(body("ok").querySelector(".ad-headline.is-ok"));
  assert.match(textOf(body("erro")), /Não consegui ler agora/);
  assert.match(textOf(body("lanca")), /Não consegui ler agora/);
  assert.match(textOf(body("carregando")), /Carregando/);
  view.stop();
  assert.deepEqual([...stopped].sort(), ["carregando", "erro", "ok"]);
});

test("um cartão que falha e depois volta a ler volta a mostrar o valor", () => {
  document.body.innerHTML = `<div id="view"></div>`;
  let push;
  g("initAdminOverview")(document.getElementById("view"), { cards: [{ id: "x", title: "X", watch: (onView, onError) => { push = { onView, onError }; return () => {}; } }] });
  push.onError(new Error("queda"));
  assert.match(textOf(document.querySelector("[data-card-body=x]")), /Não consegui ler/);
  push.onView({ headline: "de volta", lines: [] });
  assert.match(textOf(document.querySelector("[data-card-body=x]")), /^de volta$/);
});
