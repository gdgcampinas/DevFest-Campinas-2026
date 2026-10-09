/**
 * A janela do mural de recados (docs/js/features/wall-window.js): antes de abrir, aberta, depois de fechar e o interruptor manual que fecha na hora.
 *   node --test DevFestIA/tools/mural/wall-window.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { wallPhase } = load("features/wall-window.js");

const config = { open: true, window: { from: "2026-11-28T08:00:00-03:00", until: "2026-11-28T17:30:00-03:00" } };
const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);

test("antes das 08:00 é 'before', das 08:00 até antes das 17:30 é 'open', e a partir das 17:30 é 'closed'", () => {
  assert.equal(wallPhase(at("07:59"), config), "before");
  assert.equal(wallPhase(at("08:00"), config), "open");
  assert.equal(wallPhase(at("12:00"), config), "open");
  assert.equal(wallPhase(at("17:29"), config), "open");
  assert.equal(wallPhase(at("17:30"), config), "closed");
  assert.equal(wallPhase(at("23:00"), config), "closed");
});

test("o dia importa (a janela é o dia do evento): véspera é 'before' e o dia seguinte é 'closed'; o fuso do evento vale (11:00Z já é 08:00 em Campinas)", () => {
  assert.equal(wallPhase(new Date("2026-11-27T20:00:00-03:00"), config), "before");
  assert.equal(wallPhase(new Date("2026-11-29T09:00:00-03:00"), config), "closed");
  assert.equal(wallPhase(new Date("2026-11-28T11:00:00Z"), config), "open");
  assert.equal(wallPhase(new Date("2026-11-28T10:59:00Z"), config), "before");
});

test("interruptor manual: open false fecha na hora, mesmo dentro da janela", () => {
  assert.equal(wallPhase(at("12:00"), { ...config, open: false }), "closed");
  assert.equal(wallPhase(at("07:00"), { ...config, open: false }), "closed");
});
