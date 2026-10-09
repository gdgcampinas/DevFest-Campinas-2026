/**
 * Linha do dia do mural (docs/js/features/mural-day-timeline.js): estado de cada bloco da grade em relação a agora, contagem de blocos de palestras, progresso e o próximo bloco.
 *   node --test DevFestIA/tools/mural/day-timeline.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { buildDayTimeline } = load("features/mural-day-timeline.js");

const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);
const slot = (start, end, extra) => ({ start: at(start), end: at(end), ...extra });
const SCHEDULE = [
  slot("08:00", "08:30", { banner: "Credenciamento", moment: "registration" }),
  slot("09:00", "09:45", { talks: { ia: { title: "A" }, web: { title: "B" } } }),
  slot("09:45", "10:30", { talks: { ia: { title: "C", highlight: "codejam" }, web: { title: "D" } } }),
  slot("12:00", "13:20", { banner: "Almoço", moment: "lunch" }),
  slot("13:30", "14:15", { talks: { ia: { title: "E" } } }),
];
const highlightLabelOf = data => (data.highlight === "codejam" ? "Coding Jam" : null);

test("antes do dia: tudo é futuro, nenhum bloco de palestras passou e o próximo é o primeiro", () => {
  const timeline = buildDayTimeline({ schedule: SCHEDULE, now: at("07:00"), highlightLabelOf });
  assert.deepEqual(timeline.blocks.map(block => block.status), ["future", "future", "future", "future", "future"]);
  assert.equal(timeline.talksDone, 0);
  assert.equal(timeline.talksTotal, 3);
  assert.equal(timeline.progress, 0);
  assert.equal(timeline.current, null);
  assert.equal(timeline.next.label, "Credenciamento");
});

test("durante: passado, no ar e futuro; os blocos de palestras são numerados e o destaque da sessão aparece", () => {
  const timeline = buildDayTimeline({ schedule: SCHEDULE, now: at("10:00"), highlightLabelOf });
  assert.deepEqual(timeline.blocks.map(block => block.status), ["past", "past", "now", "future", "future"]);
  assert.deepEqual(timeline.blocks.map(block => block.talkNumber ?? null), [null, 1, 2, null, 3]);
  assert.deepEqual(timeline.blocks.map(block => block.highlight), [null, null, "Coding Jam", null, null]);
  assert.equal(timeline.talksDone, 1);
  assert.equal(timeline.current.talkNumber, 2);
  assert.equal(timeline.next.label, "Almoço");
  assert.deepEqual(timeline.blocks.map(block => block.minutes), [30, 45, 45, 80, 45]);
});

test("entre dois blocos (vão da grade) nenhum está no ar e o próximo é o que vem; no fim tudo passou e não há próximo; o progresso fica entre 0 e 1", () => {
  const gap = buildDayTimeline({ schedule: SCHEDULE, now: at("08:45") });
  assert.equal(gap.current, null);
  assert.equal(gap.next.talkNumber, 1);
  assert.ok(gap.progress > 0 && gap.progress < 1);
  const end = buildDayTimeline({ schedule: SCHEDULE, now: at("15:00") });
  assert.deepEqual(end.blocks.map(block => block.status), ["past", "past", "past", "past", "past"]);
  assert.equal(end.talksDone, 3);
  assert.equal(end.next, null);
  assert.equal(end.progress, 1);
});
