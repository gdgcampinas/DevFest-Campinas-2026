/**
 * Testes de TELA da legenda das trilhas em linhas na Grade (docs/js/data/track-legend.js, components/track-legend.js, features/agenda.js `renderLegend`): trilha e sala em destaque, MC menor, só DEV até liberar.
 *   node --test --test-force-exit DevFestIA/tools/dom/track-legend.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/track-legend.js", "components/track-legend.js", "components/track-card.js", "features/parallel-sessions.js", "features/release-gate.js", "features/agenda.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const config = g("trackLegendRepository").getAll();
const tracks = [
  { id: "ia", label: "IA/Vibe Coding", room: "Sala Observatório", mc: "MC - Laydianne Naira", color: "blue" },
  { id: "mobile", label: "Mobile <b>x</b>", room: "", mc: "MC a definir", color: "green" },
];
const mount = options => { document.body.innerHTML = `<div class="tracks-legend"></div>`; const el = document.querySelector(".tracks-legend"); g("renderLegend")(tracks, el, options); return el; };

test("hoje só em DEV: PROD segue com a legenda em colunas", () => {
  assert.equal(g("isReleased")(config, { devMode: false }), false);
  assert.equal(g("isReleased")(config, { devMode: true }), true);
  const el = mount();
  assert.equal(el.classList.contains("tracks-legend--rows"), false);
  assert.equal(el.querySelector(".tl-row"), null);
  assert.equal(el.querySelectorAll(".item .name").length, 2);
});

test("em linhas: trilha e sala em blocos próprios, MC sem repetir 'MC -', uma linha por trilha", () => {
  const el = mount({ highlight: config });
  assert.equal(el.classList.contains("tracks-legend--rows"), true);
  const [first, second] = el.querySelectorAll(".tl-row");
  assert.equal(first.dataset.track, "ia");
  assert.equal(textOf(first.querySelector(".tl-name")), "IA/Vibe Coding");
  assert.equal(textOf(first.querySelector(".tl-room")), "Sala Observatório");
  assert.equal(textOf(first.querySelector(".tl-mc")), "MC Laydianne Naira");
  assert.equal(textOf(second.querySelector(".tl-mc")), "MC a definir", "sem o prefixo, o texto sai como está");
  assert.equal(second.querySelector(".tl-room"), null, "sem sala, sem bloco");
  assert.equal(el.querySelector("b"), null, "o nome nunca vira HTML");
});

test("a página da Grade carrega o estilo e os scripts do layout", () => {
  const html = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "..", "..", "docs", "grade.html"), "utf8");
  for (const file of ["css/track-legend.css", "js/data/track-legend.js", "js/components/track-legend.js", "js/features/release-gate.js"]) assert.ok(html.includes(file), file);
});
