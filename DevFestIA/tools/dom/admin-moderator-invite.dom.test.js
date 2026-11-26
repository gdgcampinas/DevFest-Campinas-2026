/**
 * Testes de TELA do convite de moderador pelo Gmail (docs/js/features/moderator-invite.js) e do "quem já entrou" (features/moderator-seen.js) na seção Moderadores do admin.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-moderator-invite.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf, waitFor } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/admin-sections.js", "features/two-tap-confirm.js", "features/moderator-rules.js", "data/brand.js", "components/brand.js", "components/admin-icons.js", "components/initial-avatar.js", "components/admin-card.js", "features/admin-access.js", "features/release-gate.js", "features/moderator-invite.js", "features/moderator-login.js", "features/moderator-seen.js", "data/moderator-invite-repository.js", "components/admin-moderators.js", "features/admin-moderators.js"] });
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
  const all = root.querySelector("[data-moderator-invite='*']");
  assert.equal(all.target, "_blank");
  assert.equal(paramsOf(all.href).get("bcc"), "ana@gmail.com,bia@gmail.com");
  assert.equal(mount({ withInvite: false }).root.querySelector("[data-moderator-invite], [data-moderator-invite='*']"), null);
});

test("quem não consegue ler a lista (não é o dono) não vê nenhum botão de convite", () => {
  const { root } = mount({ listenError: { code: "permission-denied" } });
  assert.equal(root.querySelector("[data-moderator-invite], [data-moderator-invite='*']"), null);
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

function mountSending(mailer) {
  document.body.innerHTML = `<div id="view"></div>`;
  const repository = { listen: onNext => { onNext([{ id: "ana@gmail.com" }, { id: "bia@gmail.com" }, { id: sender }]); return () => {}; }, set: async () => {}, remove: async () => {} };
  const root = document.getElementById("view");
  const sending = g("createModeratorInvite")({ invite: config.invite, released: true, sender, adminUrl, mailer });
  g("initAdminModerators")(root, { repository, rules, config, selfEmail: sender, invite: sending, schedule: createFakeClock().schedule });
  const button = key => root.querySelector(`[data-moderator-send="${key}"]`);
  const message = () => textOf(root.querySelector("[data-slot=message]"));
  return { root, button, message };
}

test("o site publicado envia pelo app da web do Google (sendUrl) e usa o repository do envio", () => {
  assert.match(config.invite.sendUrl, /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/);
});

test("com envio pelo site: nada de link do Gmail; o 1º toque pede confirmação e o 2º envia assunto, texto e destinatário", async () => {
  const calls = [];
  const { root, button, message } = mountSending({ send: async mail => { calls.push(mail); return [...mail.emails]; } });
  assert.equal(root.querySelector("[data-moderator-invite]"), null);
  assert.equal(button(sender), null);
  button("ana@gmail.com").click();
  assert.match(textOf(button("ana@gmail.com")), /Toque de novo para ENVIAR/);
  assert.equal(calls.length, 0);
  button("ana@gmail.com").click();
  await waitFor(() => /Convite enviado: 1\./.test(message()));
  assert.deepEqual([...calls[0].emails], ["ana@gmail.com"]);
  assert.equal(calls[0].subject, config.invite.subject);
  assert.ok(calls[0].body.includes(adminUrl) && !calls[0].body.includes("{url}"));
  button("*").click();
  button("*").click();
  await waitFor(() => /Convite enviado: 2\./.test(message()));
  assert.deepEqual([...calls[1].emails], ["ana@gmail.com", "bia@gmail.com"]);
});

test("envio recusado explica o motivo", async () => {
  for (const [code, expected] of [["quota", /limite de e-mails/], ["not-owner", /só o dono/], ["qualquer", /Não consegui enviar o convite/]]) {
    const { button, message } = mountSending({ send: async () => { throw Object.assign(new Error("x"), { code }); } });
    button("ana@gmail.com").click();
    button("ana@gmail.com").click();
    await waitFor(() => expected.test(message()));
  }
});

test("o repository do envio manda o login e o convite como texto simples e transforma recusa em erro com código", async () => {
  const requests = [];
  const make = response => g("createModeratorInviteRepository")({ url: "https://script/exec", getToken: async () => "tok", fetchImpl: async (url, options) => { requests.push({ url, options }); return { json: async () => response }; } });
  assert.deepEqual(await make({ ok: true, sent: ["a@g.com"] }).send({ emails: ["a@g.com"], subject: "s", body: "b" }), ["a@g.com"]);
  assert.equal(requests[0].url, "https://script/exec");
  assert.equal(requests[0].options.method, "POST");
  assert.match(requests[0].options.headers["Content-Type"], /^text\/plain/);
  assert.deepEqual(JSON.parse(requests[0].options.body), { idToken: "tok", emails: ["a@g.com"], subject: "s", body: "b" });
  await assert.rejects(make({ ok: false, error: "quota" }).send({ emails: [], subject: "", body: "" }), error => error.code === "quota");
  const offline = g("createModeratorInviteRepository")({ url: "u", getToken: async () => "t", fetchImpl: async () => { throw new Error("rede"); } });
  await assert.rejects(offline.send({ emails: [], subject: "", body: "" }), error => error.code === "network");
});

function fakeInvited(initial = []) {
  let notify = () => {};
  const rows = new Map(initial.map(item => [item.id, item]));
  const saved = [];
  return {
    saved,
    listen: onNext => { notify = () => onNext([...rows.values()]); notify(); return () => {}; },
    set: async (id, data) => { saved.push([id, data.email]); rows.set(id, { id, createdAtMs: 9 }); notify(); },
  };
}
function mountTracked({ invitedRepository, seen = [], mailer = { send: async mail => [...mail.emails] } }) {
  document.body.innerHTML = `<div id="view"></div>`;
  const repository = { listen: onNext => { onNext([{ id: "ana@gmail.com" }, { id: "bia@gmail.com" }, { id: "caio@gmail.com" }, { id: sender }]); return () => {}; }, set: async () => {}, remove: async () => {} };
  const root = document.getElementById("view");
  const sending = g("createModeratorInvite")({ invite: config.invite, released: true, sender, adminUrl, mailer });
  g("initAdminModerators")(root, { repository, rules, config, selfEmail: sender, invite: sending, invitedRepository, seenRepository: { listen: onNext => { onNext(seen); return () => {}; } }, formatSeen: ms => `t${ms}`, schedule: createFakeClock().schedule });
  const button = key => root.querySelector(`[data-moderator-send="${key}"]`);
  const row = email => root.querySelector(`[data-moderator-remove="${email}"]`).closest(".ad-person");
  const message = () => textOf(root.querySelector("[data-slot=message]"));
  const press = key => { button(key).click(); button(key).click(); };
  return { root, button, row, message, press };
}

test("quem já foi convidado ou já entrou vira 'Reenviar'; 'Convidar todos' vai só pra quem falta e marca depois de enviar", async () => {
  const sent = [];
  const invitedRepository = fakeInvited([{ id: "ana@gmail.com", createdAtMs: 5 }]);
  const { button, row, message, press } = mountTracked({ invitedRepository, seen: [{ id: "bia@gmail.com", createdAtMs: 7 }], mailer: { send: async mail => { sent.push([...mail.emails]); return [...mail.emails]; } } });
  assert.match(textOf(row("ana@gmail.com")), /convidado em t5/);
  assert.equal(textOf(button("ana@gmail.com")), "Reenviar");
  assert.equal(textOf(button("bia@gmail.com")), "Reenviar");
  assert.match(textOf(row("caio@gmail.com")), /ainda não convidado/);
  assert.equal(textOf(button("caio@gmail.com")), "Convidar");
  assert.equal(textOf(button("*")), "Convidar todos");
  press("*");
  await waitFor(() => /Convite enviado: 1\./.test(message()));
  assert.deepEqual(sent, [["caio@gmail.com"]]);
  assert.deepEqual(invitedRepository.saved, [["caio@gmail.com", "caio@gmail.com"]]);
  assert.match(textOf(row("caio@gmail.com")), /convidado em t9/);
  assert.equal(textOf(button("caio@gmail.com")), "Reenviar");
  assert.equal(textOf(button("*")), "Reenviar para todos");
});

test("se marcar falhar, o aviso diz que o e-mail saiu mas não ficou marcado; falha no meio marca quem recebeu", async () => {
  const broken = { ...fakeInvited(), set: async () => { throw new Error("regra"); } };
  const first = mountTracked({ invitedRepository: broken });
  first.press("ana@gmail.com");
  await waitFor(() => /Convite enviado: 1\. Não consegui marcar/.test(first.message()));
  const partial = fakeInvited();
  const second = mountTracked({ invitedRepository: partial, mailer: { send: async () => { throw Object.assign(new Error("x"), { code: "send-failed", sent: ["ana@gmail.com"] }); } } });
  second.press("*");
  await waitFor(() => /Não consegui enviar/.test(second.message()));
  assert.deepEqual(partial.saved, [["ana@gmail.com", "ana@gmail.com"]]);
});

test("sem permissão pra ler os convites a lista não afirma quem foi convidado", () => {
  const { root, button } = mountTracked({ invitedRepository: { listen: (onNext, onError) => { onError({ code: "permission-denied" }); return () => {}; }, set: async () => {} } });
  assert.equal(root.querySelector(".ad-invited"), null);
  assert.equal(textOf(button("ana@gmail.com")), "Convidar");
});
