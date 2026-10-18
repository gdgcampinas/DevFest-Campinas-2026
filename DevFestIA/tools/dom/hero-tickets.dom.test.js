/**
 * Testes do destaque "ingressos abertos" no topo da home (docs/js/features/hero-tickets.js, components/hero-tickets.js, data/hero-tickets-texts.js): só com as vendas abertas, um cartão por tipo, tudo
 * vindo de data/tickets.js.
 *   node --test --test-force-exit DevFestIA/tools/dom/hero-tickets.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/tickets.js", "data/hero-tickets-texts.js", "components/hero-tickets.js", "features/hero-tickets.js"] });
test.after(() => site.window.close());
const g = name => site.get(name);
const types = g("ticketsRepository").getAll();
const text = g("heroTicketsTextsRepository").getAll();
const formatPrice = price => (price === 0 ? "R$ 0" : `R$ ${price.toFixed(2).replace(".", ",")}`);

test("vendas fechadas (lista de espera ou prévia): nenhum destaque", () => {
  const empty = g("heroTicketsHighlight")({ tickets: { salesOpen: false }, types, text, formatPrice });
  assert.equal(empty.badge, "");
  assert.equal(empty.cards, "");
});

test("vendas abertas: o selo e um cartão por tipo de ingresso, com nome, preço e vagas do dado", () => {
  const open = g("heroTicketsHighlight")({ tickets: { salesOpen: true }, types, text, formatPrice });
  assert.match(open.badge, /INGRESSOS ABERTOS/);
  const box = site.document.createElement("div");
  box.innerHTML = open.cards;
  const cards = [...box.querySelectorAll(".hero-open-card")];
  assert.equal(cards.length, types.length);
  assert.match(cards[0].textContent, /Ingresso Grátis[\s\S]*R\$ 0[\s\S]*Só 100 vagas/);
  assert.match(cards[1].textContent, /Ingresso \+ Kit Camiseta[\s\S]*R\$ 45,10[\s\S]*Só 100 vagas/);
});

test("o texto vindo do dado é escapado", () => {
  const html = g("heroTicketsCardsMarkup")([{ name: "<b>x</b>", price: "R$ 1", note: "", color: "red" }]);
  assert.doesNotMatch(html, /<b>x/);
});
