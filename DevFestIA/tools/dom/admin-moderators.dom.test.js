/**
 * Testes de TELA da seção Moderadores do admin (docs/js/features/admin-moderators.js, moderator-rules.js, components/admin-moderators.js): validação do e-mail, cadastrar, remover em dois toques,
 * lista em ordem, "você", sem permissão (só o dono mexe), erros de rede e o formulário que nunca perde o texto. Repository de mentira (nada toca o Firebase).
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-moderators.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/admin-sections.js", "features/two-tap-confirm.js", "features/moderator-rules.js", "components/admin-icons.js", "components/initial-avatar.js", "components/admin-card.js", "features/admin-access.js", "components/admin-moderators.js", "features/admin-moderators.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const config = g("adminModeratorsRepository").getAll();
const rules = { buildModeratorToAdd: g("buildModeratorToAdd"), sortModerators: g("sortModerators") };

test("regras: e-mail é limpo (espaços e maiúsculas) e validado, com o motivo em português", () => {
  assert.equal(g("normalizeModeratorEmail")("  Ana.Silva@Gmail.COM "), "ana.silva@gmail.com");
  assert.equal(g("validateModeratorEmail")(" A@b.co "), "a@b.co");
  for (const bad of ["", "   ", "sem-arroba", "a@b", "a @b.com", "a@@b.com", `${"x".repeat(250)}@b.com`]) assert.throws(() => g("validateModeratorEmail")(bad), /escreva o e-mail|e-mail inválido/, bad);
  assert.throws(() => g("validateModeratorEmail")(""), /escreva o e-mail/);
});

test("regras: cadastrar devolve o documento (id = e-mail, quem cadastrou), recusa repetido (mesmo com maiúscula) e lista cheia", () => {
  const add = g("buildModeratorToAdd");
  assert.deepEqual(JSON.parse(JSON.stringify(add({ text: "Novo@Gmail.com", list: [], addedBy: "Dono@gmail.com", max: 3 }))), { id: "novo@gmail.com", data: { email: "novo@gmail.com", addedBy: "dono@gmail.com" } });
  assert.throws(() => add({ text: "NOVO@gmail.com", list: [{ id: "novo@gmail.com" }], addedBy: "d@g.com", max: 3 }), /já é moderador/);
  assert.throws(() => add({ text: "x@g.com", list: [{ id: "a@g.com" }, { id: "b@g.com" }], addedBy: "d@g.com", max: 2 }), /já tem 2 moderadores/);
  assert.deepEqual([...g("sortModerators")([{ id: "b@g.com" }, { id: "a@g.com" }]).map(item => item.id)], ["a@g.com", "b@g.com"]);
});

function mount({ initial = [{ id: "zeca@gmail.com" }, { id: "ana@gmail.com" }], setImpl, removeImpl, listenError } = {}) {
  document.body.innerHTML = `<div id="view"></div>`;
  const clock = createFakeClock();
  const calls = { set: [], remove: [] };
  const listeners = [];
  const repository = {
    listen: (onNext, onError) => { listeners.push({ onNext, onError }); if (listenError) onError(listenError); else onNext(initial); return () => listeners.pop(); },
    set: setImpl ?? (async (id, data) => { calls.set.push({ id, data }); }),
    remove: removeImpl ?? (async id => { calls.remove.push(id); }),
  };
  const root = document.getElementById("view");
  const view = g("initAdminModerators")(root, { repository, rules, config, selfEmail: "dono@gmail.com", schedule: clock.schedule });
  const type = value => { root.querySelector("[data-moderator-email]").value = value; };
  const add = () => root.querySelector("[data-moderator-add]").click();
  const rows = () => [...root.querySelectorAll("[data-slot=list] .ad-person")].map(item => textOf(item.querySelector("strong")));
  return { root, view, clock, calls, listeners, type, add, rows };
}

test("lista os moderadores em ordem alfabética com o botão de remover; lista vazia explica que o dono sempre pode tudo", () => {
  const { rows, root } = mount();
  assert.deepEqual(rows(), ["ana@gmail.com", "zeca@gmail.com"]);
  assert.match(textOf(root), /só o dono da conta/i);
  const empty = mount({ initial: [] });
  assert.match(textOf(empty.root.querySelector("[data-slot=list]")), /o dono sempre pode tudo/i);
});

test("cadastrar: valida, grava com o e-mail limpo e quem cadastrou, limpa o campo e avisa; erro de validação mantém o texto", async () => {
  const { type, add, calls, root } = mount();
  type("sem-arroba");
  add();
  assert.match(textOf(root.querySelector("[data-slot=message]")), /E-mail inválido\./);
  assert.equal(root.querySelector("[data-moderator-email]").value, "sem-arroba", "o texto não some");
  assert.equal(calls.set.length, 0);
  type("  Nova@Gmail.com ");
  add();
  await waitFor(() => /Moderador cadastrado/.test(textOf(root.querySelector("[data-slot=message]"))));
  assert.deepEqual(JSON.parse(JSON.stringify(calls.set)), [{ id: "nova@gmail.com", data: { email: "nova@gmail.com", addedBy: "dono@gmail.com" } }]);
  assert.equal(root.querySelector("[data-moderator-email]").value, "");
});

test("cadastrar um e-mail que já está na lista é recusado antes de ir ao banco", () => {
  const { type, add, calls, root } = mount();
  type("ANA@gmail.com");
  add();
  assert.match(textOf(root.querySelector("[data-slot=message]")), /Esse e-mail já é moderador\./);
  assert.equal(calls.set.length, 0);
});

test("cadastrar sem permissão (conta que não é a dona) mostra 'só o dono' e mantém o texto; erro de rede mostra 'tente de novo'", async () => {
  const denied = mount({ setImpl: async () => { throw { code: "permission-denied" }; } });
  denied.type("x@g.com");
  denied.add();
  await waitFor(() => /só o dono da conta cadastra e remove/.test(textOf(denied.root.querySelector("[data-slot=message]"))));
  assert.equal(denied.root.querySelector("[data-moderator-email]").value, "x@g.com");
  const offline = mount({ setImpl: async () => { throw new Error("rede"); } });
  offline.type("y@g.com");
  offline.add();
  await waitFor(() => /Não consegui salvar/.test(textOf(offline.root.querySelector("[data-slot=message]"))));
});

test("remover: o 1º toque pede confirmação, o 2º remove; sem o 2º toque a confirmação vence", async () => {
  const { root, calls, clock } = mount();
  const button = () => root.querySelector('[data-moderator-remove="ana@gmail.com"]');
  button().click();
  assert.match(textOf(button()), /Toque de novo para REMOVER/);
  assert.equal(calls.remove.length, 0);
  await clock.tick(config.confirmMs + 1);
  assert.match(textOf(button()), /^Remover$/);
  button().click();
  button().click();
  await waitFor(() => calls.remove.length === 1);
  assert.deepEqual([...calls.remove], ["ana@gmail.com"]);
  await waitFor(() => /Moderador removido/.test(textOf(root.querySelector("[data-slot=message]"))));
});

test("a conta logada aparece com '(você)' e o e-mail do banco nunca vira HTML", () => {
  const { rows } = mount({ initial: [{ id: "dono@gmail.com" }, { id: "<b>x</b>@g.com" }] });
  assert.ok(rows().some(row => row.startsWith("dono@gmail.com (você)")));
  assert.ok(rows().some(row => row.startsWith("<b>x</b>@g.com")));
  assert.equal(document.querySelector("#view b"), null);
});

test("lista que não carrega: sem permissão avisa 'só o dono'; outro erro avisa a conexão; stop solta a escuta", () => {
  const denied = mount({ listenError: { code: "permission-denied" } });
  assert.match(textOf(denied.root.querySelector("[data-slot=message]")), /só o dono da conta/);
  const broken = mount({ listenError: new Error("rede") });
  assert.match(textOf(broken.root.querySelector("[data-slot=message]")), /Não consegui ler a lista/);
  const ok = mount();
  ok.view.stop();
  assert.equal(ok.listeners.length, 0);
  assert.equal(ok.clock.pending(), 0);
});

test("a página admin.html abre a seção Moderadores com a lista do repository", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const DOCS = path.join(__dirname, "..", "..", "..", "docs");
  const html = fs.readFileSync(path.join(DOCS, "admin.html"), "utf8");
  const scripts = [...html.matchAll(/<script src="(js\/[^"?]+)[^"]*"/g)].map(match => match[1].replace("js/", "").replace("data/schedule.dev.js", "data/schedule.js")).filter(file => !["pages/admin.js", "app.js"].includes(file));
  const page = loadSite({
    scripts, html: `<!doctype html><html><body><nav id="adminNav" hidden></nav><main id="adminBody">Carregando…</main></body></html>`, url: "http://localhost/admin.html#moderadores",
    globals: {
      moderatorClient: { restoreModerator: async () => "dono@gmail.com", signInWithGoogle: async () => "dono@gmail.com", signOutModerator: async () => {} },
      moderationModeratorsRepository: { listen: (onNext) => { onNext([{ id: "ana@gmail.com" }]); return () => {}; }, set: async () => {}, remove: async () => {} },
    },
  });
  page.run(fs.readFileSync(path.join(DOCS, "js", "pages", "admin.js"), "utf8"), "pages/admin.js");
  const body = page.document.getElementById("adminBody");
  await waitFor(() => body.querySelector("[data-moderator-add]"));
  assert.equal(body.querySelector("[data-admin-title]").textContent, "Moderadores");
  assert.match(textOf(body.querySelector("[data-slot=list]")), /ana@gmail\.com/);
  page.window.close();
});
