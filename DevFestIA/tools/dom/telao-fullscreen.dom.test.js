/**
 * Testes da entrada em tela cheia do telão (docs/js/features/telao-fullscreen.js): dica enquanto não está em tela cheia, clique ou tecla F entram, a dica some, e não faz nada se já está (quiosque).
 *   node --test --test-force-exit DevFestIA/tools/dom/telao-fullscreen.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

/** Uma página nova por teste (os ouvintes de clique e tecla ficam no documento). */
function setup({ inner = [800, 600], screen = [1920, 1080] } = {}) {
  const site = loadSite({ scripts: [...SITE_BASE, "features/telao-fullscreen.js"] });
  const { document, window } = site;
  const calls = { enter: 0 };
  document.documentElement.requestFullscreen = async () => { calls.enter++; };
  const win = { innerWidth: inner[0], innerHeight: inner[1], screen: { width: screen[0], height: screen[1] }, matchMedia: () => ({ matches: false }), addEventListener: () => {} };
  const fullscreen = site.get("createTelaoFullscreen")({ doc: document, win, hintText: "Clique ou aperte F para tela cheia" });
  fullscreen.start();
  return { site, document, window, calls, fullscreen };
}

test("janela comum: mostra a dica; o clique entra em tela cheia", () => {
  const { site, document, window, calls } = setup();
  const hint = document.querySelector(".telao-fs-hint");
  assert.match(hint.textContent, /tela cheia/);
  assert.equal(hint.hidden, false);
  document.dispatchEvent(new window.MouseEvent("click"));
  assert.equal(calls.enter, 1);
  site.window.close();
});

test("a tecla F entra em tela cheia; outras teclas não", () => {
  const { site, document, window, calls } = setup();
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "a" }));
  assert.equal(calls.enter, 0);
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "F" }));
  assert.equal(calls.enter, 1);
  site.window.close();
});

test("janela do tamanho da tela (quiosque): sem dica e sem pedir tela cheia", () => {
  const { site, document, window, calls, fullscreen } = setup({ inner: [1920, 1080] });
  assert.equal(fullscreen.isFullscreen(), true);
  assert.equal(document.querySelector(".telao-fs-hint").hidden, true);
  document.dispatchEvent(new window.MouseEvent("click"));
  assert.equal(calls.enter, 0);
  site.window.close();
});
