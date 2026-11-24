/**
 * Testes de TELA dos convites pro álbum ao vivo (docs/js/features/photo-invite.js, components/photo-invite.js): o cartão da home e a faixa da grade só dentro da janela (e somem/voltam sozinhos),
 * o link depois do check-in, o endereço do intermediário, o texto escapado e o convite padrão (modo DEV, `public`, relógio).
 *   node --test --test-force-exit DevFestIA/tools/dom/photo-invite.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "features/release-gate.js", "data/brand.js", "components/brand.js", "data/mural-config.js", "data/photo-invite.js", "features/photo-invite-window.js", "components/photo-invite.js", "features/photo-invite.js", "features/invite-slot.js", "components/talk-feedback.js", "components/rating-inputs.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const text = g("PHOTO_INVITE_TEXTS");
const HREF = "https://proxy.example.dev/join/ao-vivo";

function invite(phase, href = HREF) {
  const state = { phase };
  return { state, invite: g("createPhotoInvite")({ text, phaseOf: () => state.phase, href }) };
}
const html = markup => { const el = document.createElement("div"); el.innerHTML = markup; return el; };

test("fora da janela os três convites são vazios; dentro dela vêm o cartão, a faixa e o link, todos com o mesmo endereço", () => {
  for (const phase of ["before", "closed"]) {
    const { invite: closed } = invite(phase);
    assert.equal(closed.isOpen(), false);
    assert.equal(closed.cardMarkup(), "");
    assert.equal(closed.bannerMarkup(), "");
    assert.equal(closed.linkMarkup(), "");
  }
  const { invite: open } = invite("open");
  assert.equal(open.isOpen(), true);
  const card = html(open.cardMarkup());
  assert.equal(card.querySelector("a").getAttribute("href"), HREF);
  assert.equal(card.querySelector("a").getAttribute("target"), "_blank");
  assert.match(card.querySelector("a").getAttribute("rel"), /noopener/);
  assert.match(textOf(card), /Mande sua foto do DevFest/);
  assert.match(textOf(card), /A equipe aprova cada foto antes de ela ser exibida/);
  assert.match(textOf(card), /Entrar no álbum/);
  assert.match(textOf(card), /app Google Fotos e de uma conta Google/);
  assert.ok(card.querySelector("img.photo-invite-mascot"), "com o Gumble");
  const banner = html(open.bannerMarkup());
  assert.equal(banner.querySelector("a").getAttribute("href"), HREF);
  assert.match(textOf(banner), /Mande suas fotos pelo app Google Fotos/);
  assert.match(textOf(banner), /Enviar foto/);
  const link = html(open.linkMarkup());
  assert.equal(link.querySelector("a").getAttribute("href"), HREF);
  assert.match(textOf(link), /Tirou uma foto\? Mande para o álbum ao vivo pelo app Google Fotos/);
});

test("os textos prometem só a moderação: nada de telão", () => {
  for (const value of Object.values(text)) assert.doesNotMatch(value, /tel[ãa]o/i, value);
});

test("sem endereço do convite (sem intermediário) nada aparece, mesmo com a janela aberta", () => {
  const { invite: noHref } = invite("open", "");
  assert.equal(noHref.isOpen(), false);
  assert.equal(noHref.cardMarkup(), "");
  assert.equal(noHref.bannerMarkup(), "");
  assert.equal(noHref.linkMarkup(), "");
});

test("espaço da página: some e volta sozinho conforme a janela abre e fecha; stop pára de conferir", async () => {
  document.body.innerHTML = `<section id="slot" hidden></section>`;
  const slot = document.getElementById("slot");
  const clock = createFakeClock();
  const { state, invite: photo } = invite("before");
  const slotHandle = g("initInviteSlot")(slot, { render: photo.bannerMarkup, timer: clock.schedule, refreshMs: 30000 });
  assert.equal(slot.hidden, true);
  assert.equal(slot.innerHTML, "");
  state.phase = "open";
  await clock.tick(30001);
  assert.equal(slot.hidden, false);
  assert.match(textOf(slot), /Enviar foto/);
  state.phase = "closed";
  await clock.tick(30001);
  assert.equal(slot.hidden, true);
  assert.equal(slot.innerHTML, "");
  slotHandle.stop();
  assert.equal(clock.pending(), 0);
});

test("depois do check-in: o link aparece no bloco 'check-in feito' (só dentro da janela); sem check-in ou sem o parâmetro, nada muda", () => {
  const withInvite = html(g("talkFeedbackMarkup")({ phase: "waiting", entryKey: "k", checkedIn: true, photoInvite: invite("open").invite.linkMarkup() }));
  assert.match(textOf(withInvite.querySelector(".talk-feedback--waiting")), /Check-in feito/);
  assert.match(textOf(withInvite.querySelector(".talk-feedback--waiting")), /Tirou uma foto\?/);
  const closed = html(g("talkFeedbackMarkup")({ phase: "waiting", entryKey: "k", checkedIn: true, photoInvite: invite("closed").invite.linkMarkup() }));
  assert.doesNotMatch(textOf(closed), /foto/);
  const noCheckin = html(g("talkFeedbackMarkup")({ phase: "waiting", entryKey: "k", checkedIn: false, photoInvite: invite("open").invite.linkMarkup() }));
  assert.doesNotMatch(textOf(noCheckin), /foto/, "sem check-in o convite não aparece");
  const plain = html(g("talkFeedbackMarkup")({ phase: "waiting", entryKey: "k", checkedIn: true }));
  assert.doesNotMatch(textOf(plain), /foto/, "sem o parâmetro, nada muda");
});

test("o convite padrão: liberado em produção (public true), vale pela janela e pelo relógio do site (?demo=), abre sempre no modo DEV, e o interruptor open false fecha tudo", () => {
  const config = g("PHOTO_INVITE");
  assert.equal(config.public, true, "liberado em produção pelo Renato; a janela é que segura até 28/11 07:30");
  assert.equal(config.window.from, "2026-11-28T07:30:00-03:00");
  window.isDevModeStored = () => false;
  window.resolveNow = () => () => new Date("2026-11-28T12:00:00-03:00");
  assert.equal(g("defaultPhotoInvite")().isOpen(), true, "produção, dentro da janela");
  window.isDevModeStored = () => true;
  assert.equal(g("defaultPhotoInvite")().isOpen(), true, "DEV: a janela não vale");
  assert.ok(g("defaultPhotoInvite")().cardMarkup().includes("/join/ao-vivo"), "o endereço sai do intermediário do mural");
  window.isDevModeStored = () => false;
  try {
    window.resolveNow = () => () => new Date("2026-11-28T07:00:00-03:00");
    assert.equal(g("defaultPhotoInvite")().isOpen(), false, "antes das 07:30 fica fechado");
    window.resolveNow = () => () => new Date("2026-11-29T00:30:00-03:00");
    assert.equal(g("defaultPhotoInvite")().isOpen(), false, "depois da meia-noite fica fechado");
    window.resolveNow = () => () => new Date("2026-11-28T12:00:00-03:00");
    config.open = false;
    assert.equal(g("defaultPhotoInvite")().isOpen(), false, "interruptor manual fecha na hora");
  } finally {
    config.open = true;
  }
});

test("texto do convite nunca vira HTML", () => {
  const el = html(g("photoInviteCardMarkup")({ text: { cardTitle: "<b>x</b>", cardText: "<i>y</i>", cardButton: "<u>z</u>" }, href: 'a"b' }));
  assert.equal(el.querySelectorAll("b").length, 1, "só o <b> do próprio cartão");
  assert.equal(textOf(el.querySelector("b")), "<b>x</b>");
  assert.equal(el.querySelector("i"), null);
  assert.equal(el.querySelector("u"), null);
  assert.equal(el.querySelector("a").getAttribute("href"), 'a"b');
});
