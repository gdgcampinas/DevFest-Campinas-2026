/**
 * Testes de TELA da seção Palestras do admin (docs/js/features/admin-talks-section.js, admin-talks.js, components/admin-talks.js): uma caixa por trilha, a palestra no ar ou a próxima, os botões
 * (perguntas, quadro da sala, pódio do Coding Jam só onde há concurso), tudo em aba própria, a atualização com o relógio e o desligamento.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-talks.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({
  scripts: [...SITE_BASE, "features/scheduler.js", "data/mock-links.js", "data/mock-photo.js", "data/mock-speakers.js", "data/mock-talks.js", "data/schedule-builder.js", "data/schedule.js", "data/favorites.js",
    "features/agenda.js", "features/talk-index.js", "data/admin-sections.js", "features/admin-talks.js", "components/admin-talks.js", "features/admin-talks-section.js"],
});
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const SCHEDULE = g("SCHEDULE");
const TRACKS = g("TRACKS");
const EVENT = g("EVENT");
const links = g("adminTrackLinksRepository").getAll();
const codeOf = (slot, trackId) => g("talkShareCode")(slot, trackId, EVENT.timezone);
const hasContest = g("talkHighlightsRepository").hasContest;
const formatTime = value => `h${new Date(value).toISOString().slice(11, 16)}`;
const talkSlots = SCHEDULE.filter(slot => slot.talks);
const FIRST_TALK = new Date("2026-11-28T12:10:00Z");
const AFTER = new Date("2026-11-28T21:00:00Z");
const jamSlot = talkSlots.find(slot => slot.talks.ia.highlight === "codejam");

function mount({ start = FIRST_TALK, injectedLinks = links } = {}) {
  document.body.innerHTML = `<div id="view"></div>`;
  const clock = createFakeClock(start.getTime());
  const view = g("initAdminTalksSection")(document.getElementById("view"), { schedule: SCHEDULE, tracks: TRACKS, now: () => new Date(clock.nowMs()), codeOf, hasContest, links: injectedLinks, formatTime, refreshMs: g("adminTalksConfigRepository").getAll().refreshMs, timer: clock.schedule });
  return { view, clock, root: document.getElementById("view") };
}
const card = (root, trackId) => root.querySelector(`[data-track="${trackId}"]`);

test("uma caixa por trilha, na ordem da grade, com a cor, o nome e a sala da trilha e a palestra no ar", () => {
  const { root } = mount();
  assert.deepEqual([...root.querySelectorAll("[data-track]")].map(element => element.dataset.track), [...TRACKS.map(track => track.id)]);
  const ia = card(root, "ia");
  assert.equal(ia.getAttribute("style"), `--track-color:${TRACKS[0].color}`);
  assert.match(textOf(ia.querySelector("h2")), new RegExp(`^${TRACKS[0].label} · ${TRACKS[0].room}$`));
  assert.equal(textOf(ia.querySelector(".mod-hint")), `no ar, ${talkSlots[0].talks.ia.title} (${formatTime(talkSlots[0].start)})`);
  assert.match(textOf(root.querySelector(".mod-hint")), /Cada tela abre em aba própria/);
});

test("botões: perguntas e quadro da sala em toda trilha, pódio do Coding Jam só onde há concurso, com o código da palestra; tudo em aba nova", () => {
  const { root } = mount();
  const hrefs = trackId => [...card(root, trackId).querySelectorAll("a")].map(link => link.getAttribute("href"));
  assert.deepEqual(hrefs("webdata"), ["moderacao.html?trilha=webdata", "checkin-display.html?trilha=webdata"]);
  assert.deepEqual(hrefs("ia"), ["moderacao.html?trilha=ia", "checkin-display.html?trilha=ia", `moderacao.html?trilha=ia&palestra=${codeOf(jamSlot, "ia")}`]);
  assert.equal(textOf(card(root, "ia").querySelector("[data-link=codejam]")), "Pódio do Coding Jam");
  assert.ok([...root.querySelectorAll("a")].every(link => link.target === "_blank" && link.rel === "noopener"));
});

test("a caixa acompanha o relógio: a palestra no ar vira a próxima e depois 'sem palestra'; stop pára de atualizar", async () => {
  const { root, clock, view } = mount();
  await clock.tick(AFTER.getTime() - FIRST_TALK.getTime() + 60000);
  assert.equal(textOf(card(root, "ia").querySelector(".mod-hint")), "sem palestra");
  view.stop();
  const html = root.innerHTML;
  await clock.tick(10 * 60000);
  assert.equal(root.innerHTML, html);
  assert.equal(clock.pending(), 0);
});

test("antes do evento mostra a próxima palestra de cada trilha", () => {
  const { root } = mount({ start: new Date("2026-11-28T10:00:00Z") });
  assert.match(textOf(card(root, "mobile").querySelector(".mod-hint")), /^próxima, /);
});

test("os botões vêm do dado: link novo aparece sem mexer no código e o texto do dado é escapado", () => {
  const { root } = mount({ injectedLinks: [{ id: "x", label: "<b>Novo</b>", href: "nova-tela.html" }] });
  const link = card(root, "mobile").querySelector("a");
  assert.equal(link.getAttribute("href"), "nova-tela.html?trilha=mobile");
  assert.equal(link.querySelector("b"), null);
  assert.equal(textOf(link), "<b>Novo</b>");
});

test("regras puras: linha da sala, botões por trilha e as dependências padrão do site", () => {
  const room = { track: { id: "ia" }, phase: "next", talk: { title: "T", start: new Date("2026-11-28T12:00:00Z") }, contest: null };
  assert.equal(g("describeRoomLine")(room, formatTime), "próxima, T (h12:00)");
  assert.equal(g("describeRoomLine")({ ...room, phase: "none", talk: null }, formatTime), "sem palestra");
  assert.deepEqual([...g("adminTrackLinks")(room, links).map(link => link.id)], ["perguntas", "quadro"]);
  window.resolveNow = () => () => FIRST_TALK;
  const deps = g("defaultAdminTalksDeps")();
  assert.equal(deps.schedule, SCHEDULE);
  assert.equal(deps.codeOf(talkSlots[0], "ia"), codeOf(talkSlots[0], "ia"));
  assert.equal(deps.now().getTime(), FIRST_TALK.getTime());
});
