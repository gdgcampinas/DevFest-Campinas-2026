/**
 * Testes de TELA do convite de moderador pelo Gmail (docs/js/features/moderator-invite.js) e do "quem já entrou" (features/moderator-seen.js) na seção Moderadores do admin.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-moderator-invite.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/admin-sections.js", "features/two-tap-confirm.js", "features/moderator-rules.js", "data/brand.js", "components/brand.js", "components/admin-icons.js", "components/initial-avatar.js", "components/admin-card.js", "features/admin-access.js", "features/release-gate.js", "features/moderator-invite.js", "features/moderator-login.js", "features/moderator-seen.js", "components/admin-moderators.js", "features/admin-moderators.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const config = g("adminModeratorsRepository").getAll();
const rules = { buildModeratorToAdd: g("buildModeratorToAdd"), sortModerators: g("sortModerators") };
const sender = "dono@gmail.com";
const adminUrl = "https://x/admin.html";
const invite = () => g("createModeratorInvite")({ invite: config.invite, released: true, sender, adminUrl });
const paramsOf = href => new URL(href).searchParams;

test("o convite de uma pessoa abre o Gmail na conta que envia, com destinatário, assunto e o link do admin", () => {
  const url = invite().urlFor(["ana@gmail.com"]);
  assert.ok(url.startsWith("https://mail.google.com/mail/?"));
  const params = paramsOf(url);
  assert.equal(params.get("view"), "cm");
  assert.equal(params.get("authuser"), sender);
  assert.equal(params.get("to"), "ana@gmail.com");
  assert.equal(params.get("bcc"), null);
  assert.equal(params.get("su"), config.invite.subject);
  assert.ok(params.get("body").includes(adminUrl));
  assert.ok(!params.get("body").includes("{url}"));
});

test("convidar todos manda pra própria conta, com os moderadores em cópia oculta e sem a conta que envia", () => {
  const params = paramsOf(invite().urlFor(["ana@gmail.com", sender, "bia@gmail.com"]));
  assert.equal(params.get("to"), sender);
  assert.equal(params.get("bcc"), "ana@gmail.com,bia@gmail.com");
  assert.equal(invite().urlFor([]), "");
});

test("sem liberação não há convite; em DEV (ou com public: true) há", () => {
  const released = devMode => g("isReleased")(config.invite, { devMode });
  assert.equal(released(false), true, "liberado em PROD");
  assert.equal(released(true), true);
  assert.equal(g("isReleased")({ ...config.invite, public: false }, { devMode: false }), false, "public: false volta a esconder em PROD");
  assert.equal(g("createModeratorInvite")({ invite: config.invite, released: false, sender, adminUrl }), null);
});

function mount({ withInvite = true, seenRepository = null, listenError = null } = {}) {
  document.body.innerHTML = `<div id="view"></div>`;
  const repository = {
    listen: (onNext, onError) => { if (listenError) onError(listenError); else onNext([{ id: "ana@gmail.com" }, { id: "bia@gmail.com" }, { id: sender }]); return () => {}; },
    set: async () => {}, remove: async () => {},
  };
  const root = document.getElementById("view");
  g("initAdminModerators")(root, { repository, rules, config, selfEmail: sender, invite: withInvite ? invite() : null, seenRepository, formatSeen: ms => `t${ms}`, schedule: createFakeClock().schedule });
  return { root, row: email => root.querySelector(`[data-moderator-remove="${email}"]`).closest(".ad-person") };
}

test("a lista ganha 'Convidar' em cada linha (menos na própria) e 'Convidar todos'; sem convite não há botão", () => {
  const { root, row } = mount();
  assert.equal(paramsOf(row("ana@gmail.com").querySelector("[data-moderator-invite]").href).get("to"), "ana@gmail.com");
  assert.equal(row(sender).querySelector("[data-moderator-invite]"), null);
  const all = root.querySelector("[data-moderator-invite-all]");
  assert.equal(all.target, "_blank");
  assert.equal(paramsOf(all.href).get("bcc"), "ana@gmail.com,bia@gmail.com");
  assert.equal(mount({ withInvite: false }).root.querySelector("[data-moderator-invite], [data-moderator-invite-all]"), null);
});

test("quem não consegue ler a lista (não é o dono) não vê nenhum botão de convite", () => {
  const { root } = mount({ listenError: { code: "permission-denied" } });
  assert.equal(root.querySelector("[data-moderator-invite], [data-moderator-invite-all]"), null);
});

test("quem já entrou aparece com a hora; o resto como 'ainda não entrou'; o resumo conta sem o dono", () => {
  const seenRepository = { listen: onNext => { onNext([{ id: "ana@gmail.com", createdAtMs: 5 }]); return () => {}; } };
  const { root, row } = mount({ seenRepository });
  assert.match(textOf(row("ana@gmail.com")), /entrou em t5/);
  assert.match(textOf(row("bia@gmail.com")), /ainda não entrou/);
  assert.equal(row(sender).querySelector(".ad-seen"), null);
  assert.match(textOf(root), /1 de 2 já entraram\./);
});

test("sem permissão para ler os acessos (regra ainda não publicada) a lista não afirma que ninguém entrou", () => {
  const { root } = mount({ seenRepository: { listen: (onNext, onError) => { onError({ code: "permission-denied" }); return () => {}; } } });
  assert.equal(root.querySelector(".ad-seen"), null);
  assert.doesNotMatch(textOf(root), /já entraram|ainda não entrou/);
});

test("registrar o acesso: e-mail em minúsculas, uma vez por abertura de página; falha tenta de novo na próxima entrada", async () => {
  const record = g("recordModeratorSeen");
  const calls = [];
  const repository = { set: async (id, data) => { calls.push([id, data.email]); } };
  assert.equal(await record({ email: "Ana@Gmail.com", repository }), true);
  assert.equal(await record({ email: "ana@gmail.com", repository }), false, "já registrado");
  assert.equal(await record({ email: "", repository }), false);
  assert.equal(await record({ email: "x@g.com", repository: undefined }), false);
  assert.deepEqual(calls, [["ana@gmail.com", "ana@gmail.com"]]);
  assert.equal(await record({ email: "falha@g.com", repository: { set: async () => { throw new Error("regra"); } } }), false);
  assert.equal(await record({ email: "falha@g.com", repository }), true);
});

test("o login padrão das telas de moderação registra quem entra (entrar e restaurar) sem mudar o que devolve", async () => {
  const saved = [];
  window.moderationModeratorSeenRepository = { set: async id => { saved.push(id); } };
  window.moderatorClient = { signInWithGoogle: async () => "entrou@g.com", restoreModerator: async () => null, signOutModerator: async () => {} };
  const login = g("defaultModeratorLoginDeps")();
  assert.equal(await login.restore(), null, "ninguém logado: nada a registrar");
  assert.equal(await login.signIn(), "entrou@g.com");
  window.moderatorClient.restoreModerator = async () => "voltou@g.com";
  assert.equal(await login.restore(), "voltou@g.com");
  assert.deepEqual(saved, ["entrou@g.com", "voltou@g.com"]);
});

test("as telas com login de moderador carregam o registro", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const docs = path.join(__dirname, "..", "..", "..", "docs");
  const pages = fs.readdirSync(docs).filter(file => file.endsWith(".html")).filter(file => fs.readFileSync(path.join(docs, file), "utf8").includes("js/features/moderator-login.js"));
  assert.ok(pages.length >= 5);
  for (const file of pages) {
    const html = fs.readFileSync(path.join(docs, file), "utf8");
    assert.ok(html.includes("js/features/moderator-seen.js"), file);
    assert.ok(html.includes("js/data/moderation-repositories.js"), file);
  }
});
