/**
 * Lógica pura das cenas do mural: "agora e próximas" (docs/js/features/mural-now-next.js) e a fila de fotos com castigo
 * (docs/js/features/mural-photo-pool.js).
 *   node --test DevFestIA/tools/mural/scenes-logic.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { resolveNowAndNext } = load("features/mural-now-next.js");
const { createPhotoPool } = load("features/mural-photo-pool.js");

const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);
const talk = (title, extra = {}) => ({ title, speakers: [{ name: "Ana" }, { name: "Beto" }], ...extra });
const tracks = [{ id: "ia", label: "IA" }, { id: "mobile", label: "Mobile" }];
const schedule = [
  { banner: "Credenciamento", room: "Recepção", start: at("08:00"), end: at("08:30") },
  { talks: { ia: talk("IA 1"), mobile: talk("Mobile 1") }, start: at("09:00"), end: at("09:40") },
  { talks: { ia: talk("IA 2", { highlight: "codejam" }) }, start: at("09:45"), end: at("10:25") },
  { banner: "Almoço", start: at("12:00"), end: at("13:20") },
];
// mesma regra do resolveEventState do site, só o que a função usa
const phaseOf = (now, slots) => {
  if (now < slots[0].start) return { phase: "before" };
  if (now >= slots[slots.length - 1].end) return { phase: "after" };
  return { phase: "live", activeSlot: slots.find(slot => now >= slot.start && now < slot.end) ?? null };
};
const board = hhmm => resolveNowAndNext({ schedule, tracks, now: at(hhmm), phaseOf });
const titles = column => [column.current?.title ?? null, column.next?.title ?? null];

test("durante uma palestra: a atual e a próxima de cada trilha (a que não tem próxima fica sem)", () => {
  const result = board("09:10");
  assert.equal(result.phase, "live");
  assert.equal(result.banner, null);
  assert.deepEqual(result.columns.map(titles), [["IA 1", "IA 2"], ["Mobile 1", null]]);
  assert.deepEqual(result.columns[0].current.speakers, ["Ana", "Beto"]);
});

test("na troca entre palestras: ninguém no ar, só a próxima", () => {
  assert.deepEqual(board("09:42").columns.map(titles), [[null, "IA 2"], [null, null]]);
});

test("a atual não é repetida como próxima, e o destaque (Coding Jam) vai junto", () => {
  const column = board("10:00").columns[0];
  assert.deepEqual(titles(column), ["IA 2", null]);
  assert.equal(column.current.highlight, "codejam");
});

test("bloco sem palestra no ar (credenciamento, almoço) vira o aviso do quadro, com a próxima palestra de cada trilha", () => {
  const result = board("08:10");
  assert.deepEqual(result.banner && [result.banner.title, result.banner.room], ["Credenciamento", "Recepção"]);
  assert.deepEqual(result.columns.map(titles), [[null, "IA 1"], [null, "Mobile 1"]]);
  assert.equal(board("12:30").banner.title, "Almoço");
});

test("antes e depois do evento: a fase vem junto, sem palestra no ar", () => {
  const before = board("07:00");
  assert.equal(before.phase, "before");
  assert.deepEqual(before.columns.map(titles), [[null, "IA 1"], [null, "Mobile 1"]]);
  const after = board("14:00");
  assert.equal(after.phase, "after");
  assert.deepEqual(after.columns.map(titles), [[null, null], [null, null]]);
});

test("fotos: rodízio na ordem, foto com falha sai por um tempo e volta, e acabando as fotos devolve null", () => {
  let time = 0;
  const photos = [{ file: "1.jpg" }, { file: "2.jpg" }, { file: "3.jpg" }];
  const pool = createPhotoPool({ photos, nowMs: () => time, quarantineMs: 1000 });
  assert.deepEqual([1, 2, 3, 4].map(() => pool.next().file), ["1.jpg", "2.jpg", "3.jpg", "1.jpg"]);
  pool.reportFailure(photos[1]);
  assert.equal(pool.usable(), 2);
  assert.deepEqual([1, 2, 3].map(() => pool.next().file), ["3.jpg", "1.jpg", "3.jpg"]);
  time = 1001;
  assert.equal(pool.usable(), 3);
  assert.ok([1, 2, 3].map(() => pool.next().file).includes("2.jpg"), "a foto castigada volta depois");
  photos.forEach(photo => pool.reportFailure(photo));
  assert.equal(pool.next(), null);
  assert.equal(createPhotoPool({ photos: [], nowMs: () => 0, quarantineMs: 1 }).next(), null);
});
