/**
 * Testes da Coding Jam no calendário e no link de compartilhar (features/talk-index.js `parallelIndexEntry`, features/calendar-actions.js) e da limpeza de favoritos antigos (`retain`).
 *   node --test --test-force-exit DevFestIA/tools/dom/calendar-parallel.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/schedule-builder.js", "data/persisted-set-repository.js", "data/favorites.js", "data/talk-formats.js", "components/track-card.js", "features/agenda.js", "features/calendar.js", "features/talk-index.js", "features/parallel-sessions.js", "features/agenda-share.js"] });
const { window } = site;
test.after(() => window.close());
const g = name => site.get(name);

const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);
const tracks = [{ id: "ia", label: "IA", color: "blue", room: "Sala 1" }];
const schedule = [{ start: at("09:00"), end: at("09:40"), talks: { ia: { title: "Palestra", speakers: [{ id: "p", name: "Pessoa" }] } } }];
const session = { id: "codejam", name: "Coding Jam", kicker: "Lab de IA", place: "Laboratório", description: "Construa um protótipo", trackId: "ia", color: "green", highlightId: undefined, rounds: [{ start: "10:00", end: "12:00" }] };
const placement = { session, round: session.rounds[0], roundIndex: 0, start: at("10:00"), end: at("12:00") };
const index = () => g("buildTalkIndex")(schedule, tracks, "America/Sao_Paulo", { parallel: [placement] });
const event = { name: "DevFest", timezone: "America/Sao_Paulo", address: "Rua X" };

test("a rodada da Coding Jam entra no índice com chave de favorito e código 'horário.id'", () => {
  const entry = index().get(g("parallelTalkKey")(placement));
  assert.ok(entry);
  assert.equal(entry.code, "1000.codejam");
  assert.equal(index().getByCode("1000.codejam").key, entry.key);
  assert.equal(g("buildTalkIndex")(schedule, tracks, "America/Sao_Paulo").getAll().length, 1, "sem `parallel` o índice é o de sempre");
});

test("a entrada de calendário da Coding Jam leva nome, horário, sala e etiqueta", () => {
  const entry = g("talkToCalendarEntry")(index().get(g("parallelTalkKey")(placement)), event, "https://x/grade.html");
  assert.equal(entry.title, "Coding Jam");
  assert.equal(entry.start.toISOString(), "2026-11-28T13:00:00.000Z");
  assert.ok(entry.location.startsWith("Laboratório"));
  assert.ok(entry.details.includes("Lab de IA"));
  assert.ok(entry.details.includes("Construa um protótipo"));
});

test("o link de compartilhar ida e volta com a Coding Jam", () => {
  const idx = index();
  const key = g("parallelTalkKey")(placement);
  const url = g("agendaShareUrl")([idx.get(key).code], "https://x/grade.html");
  assert.deepEqual([...g("sharedAgendaKeys")(`?${url.split("?")[1]}`, idx)], [key]);
});

test("retain tira favoritos que não existem mais e avisa só quando algo saiu", () => {
  const favorites = g("createPersistedSetRepository")({ storageKey: "k", storage: null });
  favorites.addAll(["a", "b", "c"]);
  let calls = 0;
  favorites.subscribe(() => calls++);
  assert.equal(favorites.retain(key => key === "a"), 2);
  assert.deepEqual([...favorites.getAll()], ["a"]);
  assert.equal(favorites.count(), 1);
  assert.equal(calls, 1);
  assert.equal(favorites.retain(() => true), 0);
  assert.equal(calls, 1, "nada saiu: sem aviso");
});
