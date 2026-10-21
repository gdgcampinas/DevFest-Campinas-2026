/**
 * Testes do topo da página de ingressos (docs/js/components/tickets-hero.js, data/tickets-hero-texts.js): selo só com as vendas abertas, título com as palavras do evento, 3 passos numerados, texto escapado.
 *   node --test --test-force-exit DevFestIA/tools/dom/tickets-hero.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/tickets-hero-texts.js", "components/tickets-hero.js"] });
test.after(() => site.window.close());
const g = name => site.get(name);
const text = g("ticketsHeroTextsRepository").getAll();
const view = markup => { const el = site.document.createElement("div"); el.innerHTML = markup; return el; };

test("vendas abertas: selo, título com as palavras do evento, frase e 3 passos numerados", () => {
  const el = view(g("ticketsHeroMarkup")({ text, open: true }));
  assert.match(textOf(el.querySelector(".th-badge")), /INGRESSOS ABERTOS/);
  assert.match(textOf(el.querySelector(".th-title")), /Garanta a sua vaga no\s*DevFest Campinas 2026/);
  assert.equal(el.querySelectorAll(".th-title span").length, 3);
  assert.match(textOf(el.querySelector(".th-sub")), /Um dia inteiro de tecnologia/);
  const steps = [...el.querySelectorAll(".th-step")];
  assert.equal(steps.length, 3);
  assert.deepEqual(steps.map(step => textOf(step.querySelector(".th-step-n"))), ["1", "2", "3"]);
  assert.match(textOf(steps[1]), /Inscreva-se no Sympla/);
});

test("vendas fechadas: sem o selo 'ingressos abertos'", () => {
  assert.equal(view(g("ticketsHeroMarkup")({ text, open: false })).querySelector(".th-badge"), null);
});

test("o texto do dado é escapado", () => {
  const html = g("ticketsHeroMarkup")({ text: { ...text, lead: "<b>x</b>", steps: [{ title: "<i>y</i>", hint: "z", color: "red" }] }, open: false });
  assert.doesNotMatch(html, /<b>x|<i>y/);
});
