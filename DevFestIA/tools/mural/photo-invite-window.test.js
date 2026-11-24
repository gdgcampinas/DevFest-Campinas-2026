/**
 * A janela do convite para o álbum ao vivo (docs/js/features/photo-invite-window.js): fechado em produção até `public: true`, depois só das 07:30 até a meia-noite do dia do evento,
 * o modo DEV abrindo sempre, o interruptor manual fechando na hora e o endereço do convite pelo intermediário.
 *   node --test DevFestIA/tools/mural/photo-invite-window.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
globalThis.isReleased = load("features/release-gate.js").isReleased;
const { photoInvitePhase, photoInviteHref } = load("features/photo-invite-window.js");

const released = { public: true, open: true, window: { from: "2026-11-28T07:30:00-03:00", until: "2026-11-29T00:00:00-03:00" } };
const at = (day, hhmm) => new Date(`2026-11-${day}T${hhmm}:00-03:00`);

test("liberado: antes das 07:30 é 'before', das 07:30 até a meia-noite é 'open', e depois é 'closed'", () => {
  assert.equal(photoInvitePhase(at("28", "07:29"), released), "before");
  assert.equal(photoInvitePhase(at("28", "07:30"), released), "open");
  assert.equal(photoInvitePhase(at("28", "18:00"), released), "open");
  assert.equal(photoInvitePhase(at("28", "23:59"), released), "open");
  assert.equal(photoInvitePhase(at("29", "00:00"), released), "closed");
  assert.equal(photoInvitePhase(at("27", "20:00"), released), "before", "a véspera");
});

test("o fuso do evento vale: 10:30Z já é 07:30 em Campinas", () => {
  assert.equal(photoInvitePhase(new Date("2026-11-28T10:30:00Z"), released), "open");
  assert.equal(photoInvitePhase(new Date("2026-11-28T10:29:00Z"), released), "before");
});

test("não liberado (public false): fechado em produção, mesmo dentro do horário; o modo DEV abre sempre", () => {
  const draft = { ...released, public: false };
  assert.equal(photoInvitePhase(at("28", "12:00"), draft), "closed");
  assert.equal(photoInvitePhase(at("20", "03:00"), draft, { devMode: true }), "open");
  assert.equal(photoInvitePhase(at("30", "12:00"), draft, { devMode: true }), "open");
});

test("interruptor manual: open false fecha na hora, até no modo DEV e dentro da janela", () => {
  assert.equal(photoInvitePhase(at("28", "12:00"), { ...released, open: false }), "closed");
  assert.equal(photoInvitePhase(at("28", "12:00"), { ...released, open: false }, { devMode: true }), "closed");
});

test("endereço do botão: o convite pelo intermediário; sem intermediário ou sem álbum não há endereço", () => {
  assert.equal(photoInviteHref({ proxyUrl: "https://proxy.example.dev", albumId: "ao-vivo" }), "https://proxy.example.dev/join/ao-vivo");
  assert.equal(photoInviteHref({ proxyUrl: "https://proxy.example.dev///", albumId: "ao-vivo" }), "https://proxy.example.dev/join/ao-vivo");
  assert.equal(photoInviteHref({ proxyUrl: "", albumId: "ao-vivo" }), "");
  assert.equal(photoInviteHref({ proxyUrl: "https://proxy.example.dev", albumId: "" }), "");
});
