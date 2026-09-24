/**
 * Testa, sem navegador, o que o quadro da sala mostra em cada horário (docs/js/features/room-board.js, função pura):
 * a palestra ligada à sala, a fase das perguntas e os QR (check-in da atual, avaliação da anterior, avaliação do evento).
 *   node --test DevFestIA/tools/room/room-board.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { resolveRoomBoard } = require(path.join(__dirname, "..", "..", "..", "docs/js/features/room-board.js"));

const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);
const talk = title => ({ title, speakers: [{ name: "Ana" }] });
const schedule = [
  { banner: "Credenciamento", start: at("08:00"), end: at("08:30") },
  { talks: { ia: talk("Primeira"), mobile: talk("Outra sala") }, start: at("09:00"), end: at("09:40") },
  { talks: { ia: talk("Segunda"), mobile: talk("Outra sala 2") }, start: at("09:45"), end: at("10:25") },
  { banner: "Encerramento", start: at("10:30"), end: at("11:00") },
];
const track = { id: "ia", label: "IA" };
const params = { schedule, track, siteUrl: "https://site/", keyOf: (slot, trackId) => `${slot.start.toISOString()}|${trackId}`, codeOf: (slot, trackId) => `${slot.start.getUTCHours() - 3}.${trackId}` };
const board = hhmm => resolveRoomBoard({ ...params, now: at(hhmm) });
const panelIds = result => (result.panels ?? []).map(panel => panel.id);

test("antes do evento: só a mensagem, sem palestra nem painel", () => {
  const result = board("07:30");
  assert.equal(result.message, "O evento ainda não começou.");
  assert.equal(result.talk, null);
  assert.equal(result.panels, undefined);
});

test("evento começou mas a trilha ainda não tem palestra: sem palestra e sem perguntas", () => {
  const result = board("08:40");
  assert.equal(result.talk, null);
  assert.equal(result.message, "Nenhuma palestra agora nesta sala.");
});

test("durante a 1ª palestra: ela é a palestra da sala, perguntas abertas, QR só de check-in", () => {
  const result = board("09:20");
  assert.equal(result.talk.kind, "live");
  assert.equal(result.talk.data.title, "Primeira");
  assert.equal(result.talk.key, "2026-11-28T12:00:00.000Z|ia");
  assert.equal(result.talk.progress, 0.5);
  assert.equal(result.questionsPhase, "open");
  assert.deepEqual(panelIds(result), ["cdCheckin"]);
  assert.match(result.panels[0].url, /grade\.html\?checkin=9\.ia$/);
});

test("logo depois da 1ª: continua com ela (perguntas encerradas) e chama pra avaliar", () => {
  const result = board("09:42");
  assert.equal(result.talk.kind, "last");
  assert.equal(result.talk.data.title, "Primeira");
  assert.equal(result.questionsPhase, "closed");
  assert.deepEqual(panelIds(result), ["cdRate"]);
  assert.equal(result.panels[0].heading, "Avalie esta palestra");
});

test("durante a 2ª: perguntas da 2ª abertas, QR de check-in dela e de avaliação da anterior", () => {
  const result = board("10:00");
  assert.equal(result.talk.data.title, "Segunda");
  assert.equal(result.questionsPhase, "open");
  assert.deepEqual(panelIds(result), ["cdRate", "cdCheckin"]);
  assert.equal(result.panels[0].heading, "Avalie a palestra anterior");
  assert.match(result.panels[0].url, /avaliar=9\.ia$/);
});

test("depois da última palestra, ainda no evento: perguntas encerradas da última e QR de avaliação", () => {
  const result = board("10:27");
  assert.equal(result.talk.data.title, "Segunda");
  assert.equal(result.questionsPhase, "closed");
  assert.deepEqual(panelIds(result), ["cdRate"]);
});

test("depois do evento: sem palestra na sala, avaliação da última e do evento", () => {
  const result = board("11:10");
  assert.equal(result.talk, null);
  assert.equal(result.questionsPhase, null);
  assert.deepEqual(panelIds(result), ["cdRate", "cdEvent"]);
  assert.equal(result.panels[1].url, "https://site/index.html?avaliar=1");
});

test("a palestra é da trilha da sala, nunca de outra trilha no mesmo horário", () => {
  const mobile = resolveRoomBoard({ ...params, track: { id: "mobile" }, now: at("09:20") });
  assert.equal(mobile.talk.data.title, "Outra sala");
  assert.match(mobile.talk.key, /\|mobile$/);
});
