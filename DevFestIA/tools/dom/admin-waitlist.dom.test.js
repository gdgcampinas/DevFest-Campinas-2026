/**
 * Testes de TELA da seção Lista de espera do admin (docs/js/features/admin-waitlist.js, components/admin-waitlist.js): a lista ao vivo, o total de PESSOAS (e-mail repetido conta uma vez), a busca, o CSV baixado,
 * os e-mails copiados, remover em dois toques e os avisos de erro. Banco, arquivo e área de transferência de mentira; o texto da plateia nunca vira HTML.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-waitlist.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({
  scripts: [...SITE_BASE, "data/email-hash.js", "components/escape-html.js", "data/brand.js", "components/brand.js", "components/admin-icons.js", "components/initial-avatar.js", "components/admin-card.js", "data/waitlist-config.js", "data/admin-sections.js",
    "features/waitlist-rules.js", "features/two-tap-confirm.js", "components/admin-waitlist.js", "features/admin-waitlist.js"],
});
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const text = g("adminWaitlistRepository").getAll();
const rules = { dedupeWaitlist: g("dedupeWaitlist"), sortWaitlist: g("sortWaitlist"), waitlistCsv: g("waitlistCsv"), waitlistEmails: g("waitlistEmails") };
const entries = [
  { id: "u1_interest", name: "Ana Souza", email: "ana@example.com", source: "home", lang: "pt", createdAtMs: 1000 },
  { id: "u2_interest", name: "Ana (2º aparelho)", email: "ANA@example.com", source: "ingressos", createdAtMs: 3000 },
  { id: "u3_interest", name: "Beto Lima", email: "beto@example.com", lang: "en", createdAtMs: 2000 },
];

function mount({ list = entries, removeImpl, copyImpl, listenError = null } = {}) {
  document.body.innerHTML = `<div id="adminBody"></div>`;
  const root = document.getElementById("adminBody");
  const clock = createFakeClock();
  const removed = [];
  const downloads = [];
  const copies = [];
  const repository = {
    listen: (filters, onNext, onError) => { if (listenError) onError(listenError); else onNext(list); return () => {}; },
    remove: removeImpl ?? (async id => { removed.push(id); }),
  };
  const view = g("initAdminWaitlist")(root, {
    repository, rules, text, confirmMs: 5000, schedule: clock.schedule, formatDate: ms => `d${ms}`,
    download: file => downloads.push(file),
    copy: copyImpl ?? (async value => { copies.push(value); }),
  });
  return { root, view, clock, removed, downloads, copies, names: () => [...root.querySelectorAll(".ad-person-main strong")].map(el => textOf(el)) };
}

test("lista do mais novo pro mais antigo, com e-mail, origem, idioma e data; o total conta PESSOAS (e-mail repetido vale um) e avisa dos repetidos", () => {
  const { root, names } = mount();
  assert.equal(JSON.stringify(names()), JSON.stringify(["Ana (2º aparelho)", "Beto Lima", "Ana Souza"]));
  assert.equal(textOf(root.querySelector(".ad-count")), "2", "duas pessoas");
  assert.match(textOf(root), /1 cadastro\(s\) repetido\(s\)/);
  assert.match(textOf(root), /ana@example\.com/);
  assert.match(textOf(root), /origem: ingressos · d3000/);
  assert.match(textOf(root), /EN · d2000/);
});

test("vazia explica; busca filtra por nome ou e-mail sem apagar o que foi digitado; sem resultado avisa", () => {
  assert.match(textOf(mount({ list: [] }).root), /Ninguém na lista ainda\./);
  const { root, names } = mount();
  const search = root.querySelector("[data-waitlist-search]");
  search.value = "beto";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(JSON.stringify(names()), JSON.stringify(["Beto Lima"]));
  assert.equal(root.querySelector("[data-waitlist-search]").value, "beto", "a busca não é redesenhada");
  search.value = "zzz";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.match(textOf(root), /Ninguém encontrado com essa busca\./);
});

test("baixar CSV entrega o arquivo sem repetidos e copiar e-mails copia a lista sem repetidos", async () => {
  const { root, downloads, copies } = mount();
  root.querySelector("[data-waitlist-download]").click();
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].filename, "lista-de-espera-devfest-campinas-2026.csv");
  assert.equal(downloads[0].type, "text/csv;charset=utf-8");
  assert.equal(downloads[0].text.split("\r\n").filter(Boolean).length, 3, "cabeçalho e 2 pessoas");
  assert.match(textOf(root), /Arquivo baixado\./);
  root.querySelector("[data-waitlist-copy]").click();
  await settle();
  assert.equal(copies[0].split(", ").sort().join(","), "ana@example.com,beto@example.com");
  assert.match(textOf(root), /E-mails copiados\./);
});

test("copiar que falha avisa pra baixar o CSV", async () => {
  const { root } = mount({ copyImpl: async () => { throw new Error("negado"); } });
  root.querySelector("[data-waitlist-copy]").click();
  await settle();
  assert.match(textOf(root), /Não consegui copiar\. Baixe o CSV\./);
});

test("remover em dois toques: o 1º arma ('Toque de novo para REMOVER'), o 2º apaga o cadastro certo; passado o prazo desarma sozinho", async () => {
  const { root, clock, removed } = mount();
  const button = id => root.querySelector(`[data-waitlist-remove="${id}"]`);
  button("u3_interest").click();
  assert.equal(removed.length, 0);
  assert.match(textOf(button("u3_interest")), /Toque de novo para REMOVER/);
  await clock.tick(5001);
  assert.match(textOf(button("u3_interest")), /Remover/, "desarmou");
  button("u3_interest").click();
  button("u3_interest").click();
  await settle();
  assert.equal(JSON.stringify(removed), JSON.stringify(["u3_interest"]));
  assert.match(textOf(root), /Pessoa removida da lista\./);
});

test("sem permissão (conta que não é moderadora) e falha de leitura ou de remoção viram aviso; nada quebra", async () => {
  assert.match(textOf(mount({ list: [], listenError: { code: "permission-denied" } }).root), /Sem permissão: esta conta não é de moderador\./);
  assert.match(textOf(mount({ list: [], listenError: new Error("offline") }).root), /Não consegui ler a lista\./);
  const { root } = mount({ removeImpl: async () => { throw new Error("offline"); } });
  const button = root.querySelector("[data-waitlist-remove]");
  button.click();
  root.querySelector("[data-waitlist-remove]").click();
  await settle();
  assert.match(textOf(root), /Não consegui remover\./);
});

test("nome e e-mail da plateia nunca viram HTML; stop solta a escuta e desarma", () => {
  const { root, view } = mount({ list: [{ id: "x_interest", name: "<img src=x onerror=alert(1)>", email: "<b>a</b>@example.com", createdAtMs: 1 }] });
  assert.equal(root.querySelector(".ad-people img"), null);
  assert.equal(root.querySelector(".ad-people b"), null);
  assert.match(textOf(root), /<img src=x/);
  view.stop();
});
