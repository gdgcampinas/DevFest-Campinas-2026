/**
 * Testes de TELA dos convites pro mural de recados no site (docs/js/features/wall-invite.js, components/wall-invite.js): o cartão da home só dentro da janela (e some/volta sozinho), o link depois da
 * avaliação da palestra, o endereço da página, o texto escapado e a integração com o bloco de avaliação ("done").
 *   node --test --test-force-exit DevFestIA/tools/dom/wall-invite.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/brand.js", "components/brand.js", "data/wall-config.js", "data/wall-texts.js", "features/wall-window.js", "components/wall-invite.js", "features/wall-invite.js", "components/talk-feedback.js", "components/rating-inputs.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const text = g("WALL_TEXTS");
const config = g("WALL_CONFIG");

function invite(phase) {
  const state = { phase };
  return { state, invite: g("createWallInvite")({ config, text, phaseOf: () => state.phase, href: "recado.html" }) };
}

test("convite fora da janela é vazio (antes e depois); dentro dela vem o cartão e o link", () => {
  for (const phase of ["before", "closed"]) {
    const { invite: closed } = invite(phase);
    assert.equal(closed.isOpen(), false);
    assert.equal(closed.cardMarkup(), "");
    assert.equal(closed.linkMarkup(), "");
  }
  const { invite: open } = invite("open");
  assert.equal(open.isOpen(), true);
  const card = document.createElement("div");
  card.innerHTML = open.cardMarkup();
  assert.equal(card.querySelector("a").getAttribute("href"), "recado.html");
  assert.match(textOf(card), /Recados no telão/);
  assert.match(textOf(card), /Deixar meu recado/);
  assert.ok(card.querySelector("img.wall-invite-mascot"), "com o Gumbleton");
  const link = document.createElement("div");
  link.innerHTML = open.linkMarkup();
  assert.match(textOf(link), /Quer deixar um recado para o telão\? Deixar meu recado/);
  assert.equal(link.querySelector("a").getAttribute("href"), "recado.html");
});

test("cartão da home: some e volta sozinho conforme a janela abre e fecha; stop pára de conferir", async () => {
  document.body.innerHTML = `<section id="slot" hidden></section>`;
  const slot = document.getElementById("slot");
  const clock = createFakeClock();
  const { state, invite: wall } = invite("before");
  const card = g("initWallInviteCard")(slot, { invite: wall, timer: clock.schedule, refreshMs: 30000 });
  assert.equal(slot.hidden, true);
  assert.equal(slot.innerHTML, "");
  state.phase = "open";
  await clock.tick(30001);
  assert.equal(slot.hidden, false);
  assert.match(textOf(slot), /Deixar meu recado/);
  state.phase = "closed";
  await clock.tick(30001);
  assert.equal(slot.hidden, true);
  assert.equal(slot.innerHTML, "");
  card.stop();
  assert.equal(clock.pending(), 0);
});

test("depois de avaliar uma palestra: o convite aparece dentro do bloco 'obrigado' (só dentro da janela)", () => {
  const withInvite = document.createElement("div");
  withInvite.innerHTML = g("talkFeedbackMarkup")({ phase: "done", entryKey: "k", invite: invite("open").invite.linkMarkup() });
  assert.match(textOf(withInvite.querySelector(".talk-feedback--done")), /Obrigado pela avaliação/);
  assert.match(textOf(withInvite.querySelector(".talk-feedback--done")), /Quer deixar um recado para o telão\?/);
  const without = document.createElement("div");
  without.innerHTML = g("talkFeedbackMarkup")({ phase: "done", entryKey: "k", invite: invite("closed").invite.linkMarkup() });
  assert.doesNotMatch(textOf(without), /recado/);
  const plain = document.createElement("div");
  plain.innerHTML = g("talkFeedbackMarkup")({ phase: "done", entryKey: "k" });
  assert.doesNotMatch(textOf(plain), /recado/, "sem o parâmetro, nada muda");
});

test("o convite padrão usa o relógio do site (?demo=) e a janela do dado: dentro do dia do evento abre, fora fecha, e o modo DEV abre sempre", () => {
  window.isDevModeStored = () => false;
  window.resolveNow = () => () => new Date("2026-11-28T10:00:00-03:00");
  assert.equal(g("defaultWallInvite")().isOpen(), true);
  window.resolveNow = () => () => new Date("2026-11-28T18:00:00-03:00");
  assert.equal(g("defaultWallInvite")().isOpen(), false);
  window.resolveNow = () => () => new Date("2026-11-28T07:00:00-03:00");
  assert.equal(g("defaultWallInvite")().isOpen(), false);
  window.isDevModeStored = () => true;
  assert.equal(g("defaultWallInvite")().isOpen(), true, "DEV: a janela não vale");
});

test("texto do convite nunca vira HTML", () => {
  const html = g("wallInviteCardMarkup")({ text: { inviteTitle: "<b>x</b>", inviteText: "<i>y</i>", inviteButton: "<u>z</u>" }, href: 'a"b' });
  const el = document.createElement("div");
  el.innerHTML = html;
  assert.equal(el.querySelectorAll("b").length, 1, "só o <b> do próprio cartão");
  assert.equal(textOf(el.querySelector("b")), "<b>x</b>");
  assert.equal(el.querySelector("i"), null);
  assert.equal(el.querySelector("u"), null);
  assert.equal(el.querySelector("a").getAttribute("href"), 'a"b');
});
