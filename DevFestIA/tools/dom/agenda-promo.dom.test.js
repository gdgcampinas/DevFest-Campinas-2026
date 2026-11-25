/**
 * Testes de TELA da divulgação da "Minha agenda" (docs/js/features/agenda-promo.js, components/agenda-promo.js): o cartão da home, a dica da Grade e de Palestrantes, o selo "Novo",
 * a regra de abrir (DEV, `public`, `open`), o espaço da página que redesenha quando os favoritos mudam e o botão da Grade com o selo.
 *   node --test --test-force-exit DevFestIA/tools/dom/agenda-promo.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "features/release-gate.js", "data/persisted-set-repository.js", "data/favorites.js", "data/agenda-promo.js", "components/agenda-promo.js", "features/agenda-promo.js", "features/invite-slot.js", "features/favorites-filter.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const text = g("AGENDA_PROMO_TEXTS");
const html = markup => { const el = document.createElement("div"); el.innerHTML = markup; return el; };

function favoritesWith(count) {
  const state = { count, listeners: new Set() };
  return {
    state,
    count: () => state.count,
    subscribe: listener => { state.listeners.add(listener); return () => state.listeners.delete(listener); },
    set(next) { state.count = next; state.listeners.forEach(listener => listener()); },
  };
}

function promo({ count = 0, dev = true, config = { public: false, open: true, badgeUntil: "2026-11-28T00:00:00-03:00" }, now = new Date("2026-11-25T12:00:00-03:00") } = {}) {
  const favorites = favoritesWith(count);
  const built = g("createAgendaPromo")({ text, config, favorites, devMode: () => dev, now: () => now, savedLabel: n => `${n} palestras salvas` });
  return { favorites, promo: built };
}

test("cartão: quem ainda não salvou nada vê o convite e o botão 'Ver a programação' (leva à Grade)", () => {
  const card = html(promo().promo.cardMarkup());
  assert.equal(card.querySelector("a").getAttribute("href"), "grade.html");
  assert.match(textOf(card), /Monte a sua agenda/);
  assert.match(textOf(card), /Toque na estrela das palestras que quer ver/);
  assert.match(textOf(card), /exporte para o calendário ou mande no WhatsApp/);
  assert.match(textOf(card), /Ver a programação/);
  assert.ok(card.querySelector(".promo-icon svg"), "com a estrela");
});

test("cartão: quem já salvou vê a contagem e 'Abrir minha agenda'", () => {
  const card = html(promo({ count: 5 }).promo.cardMarkup());
  assert.match(textOf(card), /Sua agenda no DevFest/);
  assert.match(textOf(card), /5 palestras salvas/);
  assert.match(textOf(card), /Abrir minha agenda/);
  assert.doesNotMatch(textOf(card), /Ver a programação/);
});

test("dica: só para quem ainda não salvou nada (some na primeira estrela), cada página com a sua frase", () => {
  const { promo: fresh } = promo();
  assert.match(textOf(html(fresh.tipMarkup("gradeTip"))), /Toque na estrela de uma palestra para montar a sua agenda/);
  assert.match(textOf(html(fresh.tipMarkup("speakersTip"))), /Gostou de uma palestra\?/);
  assert.equal(promo({ count: 1 }).promo.tipMarkup("gradeTip"), "");
  assert.equal(promo({ count: 3 }).promo.tipMarkup("speakersTip"), "");
});

test("selo 'Novo': vale até a data de `badgeUntil` e some depois", () => {
  assert.match(textOf(html(promo().promo.badgeMarkup())), /Novo/);
  assert.equal(promo({ now: new Date("2026-11-28T00:00:01-03:00") }).promo.badgeMarkup(), "");
  assert.equal(promo({ now: new Date("2026-11-27T23:59:59-03:00") }).promo.badgeMarkup() === "", false);
});

test("regra de abrir: `public: false` só no modo DEV; `public: true` abre em produção; `open: false` fecha tudo, até no DEV", () => {
  const closedEverywhere = { public: false, open: true, badgeUntil: "2026-11-28T00:00:00-03:00" };
  assert.equal(promo({ dev: false, config: closedEverywhere }).promo.isOpen(), false, "produção, ainda não liberado");
  assert.equal(promo({ dev: false, config: closedEverywhere }).promo.cardMarkup(), "");
  assert.equal(promo({ dev: false, config: closedEverywhere }).promo.tipMarkup("gradeTip"), "");
  assert.equal(promo({ dev: false, config: closedEverywhere }).promo.badgeMarkup(), "");
  assert.equal(promo({ dev: true, config: closedEverywhere }).promo.isOpen(), true, "DEV");
  assert.equal(promo({ dev: false, config: { ...closedEverywhere, public: true } }).promo.isOpen(), true, "liberado");
  assert.equal(promo({ dev: true, config: { ...closedEverywhere, public: true, open: false } }).promo.isOpen(), false, "interruptor manual");
});

test("o dado nasce fechado em produção (public false): a liberação é uma decisão do Renato", () => {
  assert.equal(g("AGENDA_PROMO").public, false);
  assert.equal(g("AGENDA_PROMO").open, true);
});

test("texto do aviso nunca vira HTML", () => {
  const el = html(g("agendaPromoCardMarkup")({ title: "<b>x</b>", text: "<i>y</i>", button: "<u>z</u>", href: 'a"b' }));
  assert.equal(el.querySelector("i"), null);
  assert.equal(el.querySelector("u"), null);
  assert.equal(el.querySelector("a").getAttribute("href"), 'a"b');
  assert.equal(html(g("agendaPromoTipMarkup")({ text: "<i>y</i>" })).querySelector("i"), null);
  assert.equal(html(g("agendaPromoBadgeMarkup")({ text: "<i>y</i>" })).querySelector("i"), null);
});

test("espaço da página: redesenha na hora em que os favoritos mudam (a dica some na 1ª estrela) e `stop` solta tudo", async () => {
  document.body.innerHTML = `<div id="slot" hidden></div>`;
  const slot = document.getElementById("slot");
  const clock = createFakeClock();
  const { favorites, promo: built } = promo();
  const handle = g("initInviteSlot")(slot, { render: () => built.tipMarkup("gradeTip"), timer: clock.schedule, refreshMs: 30000, subscribe: favorites.subscribe });
  assert.equal(slot.hidden, false);
  assert.match(textOf(slot), /montar a sua agenda/);
  favorites.set(1);
  assert.equal(slot.hidden, true, "primeira estrela: some sem esperar o relógio");
  assert.equal(slot.innerHTML, "");
  favorites.set(0);
  assert.equal(slot.hidden, false, "tirou a estrela: volta");
  handle.stop();
  assert.equal(clock.pending(), 0);
  assert.equal(favorites.state.listeners.size, 0, "solta a inscrição nos favoritos");
});

test("botão 'Minha agenda' da Grade: o selo 'Novo' vem depois da contagem; sem selo, nada muda", () => {
  const button = document.createElement("button");
  g("renderFavoritesToggle")(button, "Minha agenda", { badge: promo().promo.badgeMarkup() });
  assert.match(textOf(button), /Minha agenda\s*0\s*Novo/);
  assert.ok(button.querySelector(".promo-badge"));
  assert.ok(button.querySelector("[data-fav-count]"), "a contagem continua onde estava");
  const plain = document.createElement("button");
  g("renderFavoritesToggle")(plain, "Minha agenda");
  assert.equal(plain.querySelector(".promo-badge"), null);
});

test("o aviso padrão sai dos favoritos do site e do modo DEV guardado", () => {
  window.isDevModeStored = () => true;
  window.resolveNow = () => () => new Date("2026-11-25T12:00:00-03:00");
  const card = html(g("defaultAgendaPromo")().cardMarkup());
  assert.match(textOf(card), /Monte a sua agenda|Sua agenda no DevFest/);
  window.isDevModeStored = () => false;
  assert.equal(g("defaultAgendaPromo")().cardMarkup(), "", "produção: fechado até `public: true`");
});
