/**
 * Testa o modo ensaio (docs/js/features/rehearsal.js, funções puras): `?ensaio=HH:MM` desloca a grade inteira pra a
 * primeira palestra começar naquele horário de hoje, preservando os intervalos, pra dar pra testar o fluxo completo
 * (perguntas, quadro, moderação) com o banco de verdade em qualquer dia.
 *   node --test DevFestIA/tools/room/rehearsal.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { parseRehearsalStart, rehearsalDeltaMs, shiftSchedule } = require(path.join(__dirname, "..", "..", "..", "docs/js/features/rehearsal.js"));

const OFFSET = "-03:00";
const at = iso => new Date(iso);
const schedule = () => [
  { banner: "Credenciamento", start: at("2026-11-28T08:00:00-03:00"), end: at("2026-11-28T08:30:00-03:00") },
  { talks: { ia: {} }, start: at("2026-11-28T09:00:00-03:00"), end: at("2026-11-28T09:40:00-03:00") },
  { talks: { ia: {} }, start: at("2026-11-28T09:45:00-03:00"), end: at("2026-11-28T10:25:00-03:00") },
];
const now = at("2026-09-24T17:00:00Z"); // 14:00 em Campinas

test("HH:MM vale pra hoje no fuso do evento; data completa vale como escrita", () => {
  assert.equal(parseRehearsalStart("14:30", now, OFFSET).toISOString(), "2026-09-24T17:30:00.000Z");
  assert.equal(parseRehearsalStart("2026-10-01T09:05", now, OFFSET).toISOString(), "2026-10-01T12:05:00.000Z");
});

test("hoje é o dia local do evento, não o dia em UTC (madrugada UTC ainda é a noite anterior em Campinas)", () => {
  const lateNight = at("2026-09-25T01:30:00Z"); // 22:30 do dia 24 em Campinas
  assert.equal(parseRehearsalStart("23:00", lateNight, OFFSET).toISOString(), "2026-09-25T02:00:00.000Z");
});

test("formato inválido devolve null (ensaio simplesmente não liga)", () => {
  for (const bad of ["", "abc", "25:00", "14:60", "14", "2026-13-01T10:00", null, undefined]) {
    assert.equal(parseRehearsalStart(bad, now, OFFSET), null, `"${bad}" deveria ser inválido`);
  }
});

test("deslocamento: a primeira PALESTRA (não o credenciamento) passa a começar no horário pedido, com os mesmos intervalos", () => {
  const slots = schedule();
  const gaps = () => slots.slice(1).map((slot, i) => slot.start - slots[i].end);
  const before = gaps();
  const delta = rehearsalDeltaMs("14:30", slots, { now, utcOffset: OFFSET });
  shiftSchedule(slots, delta);
  assert.equal(slots[1].start.toISOString(), "2026-09-24T17:30:00.000Z");
  assert.equal(slots[2].end.toISOString(), "2026-09-24T18:55:00.000Z");
  assert.equal(slots[0].start.toISOString(), "2026-09-24T16:30:00.000Z");
  assert.deepEqual(gaps(), before);
});

test("sem parâmetro válido não desloca nada", () => {
  assert.equal(rehearsalDeltaMs(null, schedule(), { now, utcOffset: OFFSET }), null);
  assert.equal(rehearsalDeltaMs("xx", schedule(), { now, utcOffset: OFFSET }), null);
});
