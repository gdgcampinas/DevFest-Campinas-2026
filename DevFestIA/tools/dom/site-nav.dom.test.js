/**
 * Testes da ordem do menu (docs/js/components/site-nav.js): a ordem nova (jornada de quem visita) só aparece no modo DEV até `SITE_NAV_ORDER.public`; a antiga segue para todo mundo enquanto isso.
 *   node --test --test-force-exit DevFestIA/tools/dom/site-nav.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/history-config.js", "features/release-gate.js", "components/site-nav.js"] });
const { document, window } = site;
test.after(() => window.close());
const g = name => site.get(name);
const labels = (options, order) => {
  const nav = document.createElement("nav");
  g("renderSiteNav")("principal", nav, { ...options, order });
  return [...nav.querySelectorAll("a")].map(a => a.textContent).join("|");
};

const OLD = "Principal|Grade|Palestrantes|Ingressos|Como chegar|Time|Patrocínio|Recados no telão|Fundos de tela|Código de Conduta";
const NEW = "Principal|Grade|Palestrantes|Ingressos|Como chegar|Recados no telão|Fundos de tela|Time|Patrocínio|Código de Conduta";

test("com a ordem ainda não pública, o público vê a ordem antiga e o modo DEV vê a nova (com o Sorteio depois de Como chegar)", () => {
  g("HISTORY_CONFIG").public = false; // este teste é da ordem do menu: a página de história é testada à parte
  const order = { public: false, ids: g("SITE_NAV_ORDER").ids };
  assert.equal(labels({ reveal: false }, order), OLD);
  assert.equal(labels({ reveal: true }, order), NEW.replace("Como chegar|", "Como chegar|Coding Jam|Sorteio|"), "em DEV entram o Sorteio e o Coding Jam");
  g("HISTORY_CONFIG").public = true;
});

test("a página 'Nossa história' fica logo depois de Principal; com a chave `HISTORY_CONFIG.public` falsa só o modo DEV a vê", () => {
  const order = { public: true, ids: g("SITE_NAV_ORDER").ids };
  const withHistory = NEW.replace("Principal|", "Principal|Nossa história|");
  assert.equal(g("HISTORY_CONFIG").public, true, "liberada em produção");
  assert.equal(labels({ reveal: false, devMode: false }, order), withHistory, "liberada vale pra todo mundo");
  g("HISTORY_CONFIG").public = false;
  try {
    assert.ok(!labels({ reveal: true, devMode: false }, order).includes("Nossa história"), "público não vê");
    assert.equal(labels({ reveal: false, devMode: true }, order), withHistory, "em DEV aparece depois de Principal");
  } finally {
    g("HISTORY_CONFIG").public = true;
  }
});

test("com a ordem pública, todo mundo vê a nova", () => {
  assert.equal(labels({ reveal: false }, { public: true, ids: g("SITE_NAV_ORDER").ids }), NEW.replace("Principal|", "Principal|Nossa história|"));
});

test("página fora da lista vai para o fim, na ordem de origem", () => {
  const sorted = g("sortPagesByOrder")([{ id: "z" }, { id: "b" }, { id: "x" }, { id: "a" }], ["a", "b"]);
  assert.equal(sorted.map(page => page.id).join(), "a,b,z,x");
});

test("a lista de ordem cobre todas as páginas do menu", () => {
  const inMenu = g("SITE_PAGES").filter(page => page.nav !== false).map(page => page.id);
  assert.deepEqual([...inMenu].sort(), [...g("SITE_NAV_ORDER").ids].sort());
});
