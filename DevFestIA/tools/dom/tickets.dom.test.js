/**
 * Testes dos INGRESSOS (docs/js/data/tickets.js, features/tickets.js): os dois tipos reais (Grátis e Ingresso + Kit Camiseta), o preço do kit com centavos (R$ 45,10, sem detalhar a taxa do Sympla),
 * o certificado só pra quem fizer check-in, o cartão com o botão de compra e a prévia de vendas abertas só em DEV (`?vendas=1`).
 *   node --test --test-force-exit DevFestIA/tools/dom/tickets.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/tickets.js", "features/tickets.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const types = () => g("ticketsRepository").getAll();
const tickets = () => ({ url: "https://sympla.test/evento", label: "Garanta sua vaga", status: "Ingressos em breve", salesOpen: false, waitlist: { enabled: true, public: true } });

test("dois tipos reais: Grátis (R$ 0) e Ingresso + Kit Camiseta (R$ 45,10), selo Vagas limitadas nos dois (sem número: o Sympla limita cada tipo), sem VIP", () => {
  assert.equal(JSON.stringify(types().map(type => [type.id, type.name, type.price])), JSON.stringify([["gratis", "Ingresso Grátis", 0], ["camiseta", "Ingresso + Kit Camiseta", 45.1]]));
  assert.ok(types().every(type => type.badge === "Vagas limitadas"));
  assert.match(types()[0].benefits.join(" "), /Certificado de participação \(para quem fizer check-in em ao menos uma palestra\)/);
  assert.match(types()[1].benefits.join(" "), /Camiseta oficial do DevFest Campinas 2026/);
  assert.ok(types().every(type => type.benefits.includes("Certificado de participação (para quem fizer check-in em ao menos uma palestra)")), "o certificado vale nos dois ingressos");
});

test("o preço aparece com centavos só quando precisa (R$ 0 e R$ 45,10) e a taxa do Sympla não é detalhada em lugar nenhum do cartão", () => {
  const open = { ...tickets(), salesOpen: true, waitlist: { enabled: false } };
  const box = document.createElement("div");
  box.innerHTML = types().map(type => g("ticketCardMarkup")(type, open)).join("");
  const prices = [...box.querySelectorAll(".ticket-price")].map(el => textOf(el).replace(/ /g, " "));
  assert.equal(JSON.stringify(prices), JSON.stringify(["R$ 0", "R$ 45,10"]));
  assert.doesNotMatch(textOf(box), /taxa|41,00|4,10/i);
  assert.ok(box.querySelectorAll('a.cta[href="https://sympla.test/evento"]').length === 2, "os dois levam ao Sympla");
  assert.equal(g("TICKETS_NOTE"), "As inscrições acontecem pelo Sympla.");
});

test("com a lista de espera ligada os cartões viram 'Avise-me quando abrir' (sem link de compra)", () => {
  const waiting = tickets();
  g("applyWaitlistMode")(waiting, { devMode: false });
  const box = document.createElement("div");
  box.innerHTML = types().map(type => g("ticketCardMarkup")(type, waiting)).join("");
  assert.ok([...box.querySelectorAll("a.cta")].every(link => link.getAttribute("href") === "ingressos.html#waitlist"));
  assert.equal(box.querySelector('a[href^="https://sympla"]'), null);
});

test("em DEV as vendas aparecem abertas (sem lista de espera); em produção a lista de espera segue enquanto for pública", () => {
  const apply = g("applyWaitlistMode");
  const dev = tickets();
  assert.equal(apply(dev, { devMode: true }), false, "sem lista de espera");
  assert.equal(dev.salesOpen, true);
  assert.equal(dev.waitlistOn, undefined);
  assert.equal(g("ticketCtaState")(dev).kind, "buy");
  const prod = tickets();
  assert.equal(apply(prod, { devMode: false }), true);
  assert.equal(prod.salesOpen, false);
});
