/**
 * Testes de TELA do casco da área de admin (docs/js/features/admin-shell.js, admin-session.js, hash-router.js, components/admin-shell.js): porta de entrada, login único, troca de seção
 * pelo hash (a seção anterior é desligada), seção sem tela ou quebrada e a página admin.html inteira (carrega os scripts do próprio HTML). Login e banco de mentira.
 *   node --test --test-force-exit DevFestIA/tools/dom/admin-shell.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const HTML = fs.readFileSync(path.join(DOCS, "admin.html"), "utf8");
const SCRIPTS = [...HTML.matchAll(/<script src="(js\/[^"?]+)[^"]*"/g)].map(match => match[1].replace("js/", "").replace("data/schedule.dev.js", "data/schedule.js")).filter(file => !["pages/admin.js", "app.js"].includes(file));
const PAGE = fs.readFileSync(path.join(DOCS, "js", "pages", "admin.js"), "utf8");
const BODY = `<!doctype html><html><body><nav id="adminNav" hidden></nav><main id="adminBody">Carregando…</main></body></html>`;

const UNITS = [...SITE_BASE, "data/admin-sections.js", "components/escape-html.js", "components/moderator-login.js", "components/admin-nav.js", "components/admin-shell.js", "features/moderator-login.js", "features/admin-session.js", "features/hash-router.js", "features/admin-nav.js", "features/admin-shell.js"];

/** Login de mentira: `restoreAs` = e-mail já logado ("" = ninguém); `signIn` pode falhar. */
function fakeLogin({ restoreAs = "", signInImpl } = {}) {
  const calls = { signOut: 0 };
  return { calls, signIn: signInImpl ?? (async () => "mod@gmail.com"), restore: async () => restoreAs || null, signOut: async () => { calls.signOut++; } };
}

function setup({ restoreAs = "", signInImpl, hash = "", mounts } = {}) {
  const site = loadSite({ scripts: UNITS, html: BODY, url: `http://localhost/admin.html${hash}` });
  const { window, document } = site;
  const sections = site.get("adminSectionsRepository").getAll();
  const events = [];
  const defaultMounts = Object.fromEntries(sections.map(section => [section.id, containerEl => {
    containerEl.innerHTML = `<p data-mounted="${section.id}">${section.title}</p>`;
    events.push(`mount:${section.id}`);
    return { stop: () => events.push(`stop:${section.id}`) };
  }]));
  const login = fakeLogin({ restoreAs, signInImpl });
  const session = site.get("createAdminSession")({ login });
  const router = site.get("createHashRouter")({ win: window, routes: sections.map(section => section.id), fallback: sections[0].id });
  const shell = site.get("initAdminShell")(document.getElementById("adminBody"), { session, router, navEl: document.getElementById("adminNav"), sections, mounts: mounts ?? defaultMounts });
  const body = document.getElementById("adminBody");
  const goTo = hashValue => { window.location.hash = hashValue; window.dispatchEvent(new window.Event("hashchange")); };
  return { site, window, document, body, nav: document.getElementById("adminNav"), events, login, session, shell, goTo };
}

test("sem login: só a porta de entrada com o botão do Google, menu escondido e nenhuma seção aberta", async () => {
  const { body, nav, events, window } = setup();
  await waitFor(() => body.querySelector("[data-mod-signin]"));
  assert.match(textOf(body), /Área de admin/);
  assert.equal(nav.hidden, true);
  assert.deepEqual(events, []);
  window.close();
});

test("quem já tinha entrado em outra tela volta logado: conta, menu e a seção da rota (padrão: visão geral)", async () => {
  const { body, nav, events, window } = setup({ restoreAs: "mod@gmail.com" });
  await waitFor(() => body.querySelector("[data-mounted]"));
  assert.match(textOf(body), /mod@gmail\.com/);
  assert.equal(nav.hidden, false);
  assert.equal(body.querySelector("[data-admin-title]").textContent, "Visão geral");
  assert.deepEqual(events, ["mount:visao-geral"]);
  assert.equal(textOf(nav.querySelector("a[aria-current]")), "Visão geral");
  window.close();
});

test("o hash da URL escolhe a seção que abre", async () => {
  const { body, events, window } = setup({ restoreAs: "mod@gmail.com", hash: "#palestras" });
  await waitFor(() => body.querySelector("[data-mounted]"));
  assert.deepEqual(events, ["mount:palestras"]);
  assert.equal(body.querySelector("[data-admin-title]").textContent, "Palestras");
  window.close();
});

test("entrar com o Google: abre a seção e mostra o e-mail", async () => {
  const { body, nav, window } = setup();
  await waitFor(() => body.querySelector("[data-mod-signin]"));
  body.querySelector("[data-mod-signin]").click();
  await waitFor(() => body.querySelector("[data-mounted]"));
  assert.match(textOf(body), /mod@gmail\.com/);
  assert.equal(nav.hidden, false);
  window.close();
});

test("login que falha: mostra o motivo e continua na porta de entrada", async () => {
  const { body, events, window } = setup({ signInImpl: async () => { throw { code: "auth/popup-closed-by-user" }; } });
  await waitFor(() => body.querySelector("[data-mod-signin]"));
  body.querySelector("[data-mod-signin]").click();
  await waitFor(() => /fechada antes de terminar/.test(textOf(body)));
  assert.ok(body.querySelector("[data-mod-signin]"));
  assert.deepEqual(events, []);
  window.close();
});

test("trocar de seção pelo hash: a anterior é desligada ANTES, a nova abre num contêiner novo e o menu acompanha", async () => {
  const { body, nav, events, goTo, window } = setup({ restoreAs: "mod@gmail.com" });
  await waitFor(() => body.querySelector("[data-mounted]"));
  const firstContainer = body.querySelector("[data-admin-view] > div");
  goTo("#telao");
  assert.deepEqual(events, ["mount:visao-geral", "stop:visao-geral", "mount:telao"]);
  assert.notEqual(body.querySelector("[data-admin-view] > div"), firstContainer);
  assert.equal(body.querySelector("[data-mounted]").dataset.mounted, "telao");
  assert.equal(textOf(nav.querySelector("a[aria-current]")), "Telão");
  assert.equal(body.querySelector("[data-admin-title]").textContent, "Telão");
  window.close();
});

test("hash desconhecido cai na primeira seção", async () => {
  const { body, events, goTo, window } = setup({ restoreAs: "mod@gmail.com", hash: "#telao" });
  await waitFor(() => body.querySelector("[data-mounted]"));
  goTo("#nao-existe");
  assert.deepEqual(events.slice(-2), ["stop:telao", "mount:visao-geral"]);
  window.close();
});

test("sair: desliga a seção aberta e volta pra porta de entrada", async () => {
  const { body, nav, events, login, window } = setup({ restoreAs: "mod@gmail.com" });
  await waitFor(() => body.querySelector("[data-mounted]"));
  body.querySelector("[data-mod-signout]").click();
  await waitFor(() => body.querySelector("[data-mod-signin]"));
  assert.equal(login.calls.signOut, 1);
  assert.deepEqual(events, ["mount:visao-geral", "stop:visao-geral"]);
  assert.equal(nav.hidden, true);
  window.close();
});

test("seção sem tela montada vira um aviso; as outras seguem funcionando", async () => {
  const { body, goTo, window } = setup({ restoreAs: "mod@gmail.com", mounts: { telao: containerEl => { containerEl.innerHTML = "<p data-mounted=\"telao\">ok</p>"; } } });
  await waitFor(() => /ainda não está disponível/.test(textOf(body)));
  goTo("#telao");
  assert.ok(body.querySelector("[data-mounted=telao]"));
  window.close();
});

test("seção que dá erro ao abrir vira um aviso e não derruba o casco nem as outras seções", async () => {
  const mounts = { "visao-geral": () => { throw new Error("quebrou"); }, telao: containerEl => { containerEl.innerHTML = "<p data-mounted=\"telao\">ok</p>"; return { stop() {} }; } };
  const warn = console.warn;
  console.warn = () => {};
  const { body, goTo, window } = setup({ restoreAs: "mod@gmail.com", mounts });
  await waitFor(() => /Não consegui abrir esta seção/.test(textOf(body)));
  goTo("#telao");
  assert.ok(body.querySelector("[data-mounted=telao]"));
  console.warn = warn;
  window.close();
});

test("parar o casco desliga a seção aberta e solta a sessão e as rotas", async () => {
  const { body, events, shell, goTo, window } = setup({ restoreAs: "mod@gmail.com" });
  await waitFor(() => body.querySelector("[data-mounted]"));
  shell.stop();
  goTo("#telao");
  assert.deepEqual(events, ["mount:visao-geral", "stop:visao-geral"]);
  window.close();
});

test("sessão: avisa quem escuta a cada entrada e saída e deixa desligar o ouvinte", async () => {
  const site = loadSite({ scripts: UNITS, html: BODY });
  const session = site.get("createAdminSession")({ login: fakeLogin() });
  const seen = [];
  const off = session.onChange(email => seen.push(email));
  await session.signIn();
  await session.signOut();
  off();
  await session.signIn();
  assert.deepEqual([...seen], ["mod@gmail.com", ""]);
  assert.equal(session.email(), "mod@gmail.com");
  site.window.close();
});

test("rotas por hash: só vale id conhecido; go muda o hash", () => {
  const site = loadSite({ scripts: UNITS, html: BODY, url: "http://localhost/admin.html#b" });
  const router = site.get("createHashRouter")({ win: site.window, routes: ["a", "b"], fallback: "a" });
  assert.equal(router.current(), "b");
  router.go("zzz");
  assert.equal(router.current(), "a");
  site.window.close();
});

test("a página admin.html inteira: abre logado na seção Atalhos com os links do dado, em aba nova", async () => {
  const site = loadSite({
    scripts: SCRIPTS,
    html: BODY,
    url: "http://localhost/admin.html#atalhos",
    globals: { moderatorClient: { restoreModerator: async () => "mod@gmail.com", signInWithGoogle: async () => "mod@gmail.com", signOutModerator: async () => {} } },
  });
  site.run(PAGE, "pages/admin.js");
  const body = site.document.getElementById("adminBody");
  await waitFor(() => body.querySelector("[data-shortcut]"));
  const hrefs = [...body.querySelectorAll("[data-shortcut] a")].map(link => link.getAttribute("href"));
  assert.deepEqual(hrefs, ["mural.html", "DEV/sorteio.html?telao=1", "reset-teste.html"]);
  assert.ok([...body.querySelectorAll("[data-shortcut] a")].every(link => link.target === "_blank" && link.rel === "noopener"));
  assert.deepEqual([...site.document.querySelectorAll("#adminNav a")].map(link => link.getAttribute("href")), ["#visao-geral", "#telao", "#fotos", "#palestras", "#atalhos"]);
  site.window.close();
});

/** admin.html inteira, logada, com o banco e o intermediário de álbuns de mentira. */
function bootAdminPage(hash) {
  const controlListeners = [];
  const hiddenListeners = [];
  const site = loadSite({
    scripts: SCRIPTS,
    html: BODY,
    url: `http://localhost/admin.html${hash}`,
    globals: {
      moderatorClient: { restoreModerator: async () => "mod@gmail.com", signInWithGoogle: async () => "mod@gmail.com", signOutModerator: async () => {} },
      moderationMuralControlRepository: { listen: (key, onNext) => { controlListeners.push(key); onNext(null); return () => controlListeners.pop(); }, set: async () => {} },
      moderationMuralHiddenRepository: { listen: (id, onNext) => { hiddenListeners.push(id); onNext({ ids: [] }); return () => hiddenListeners.pop(); }, set: async () => {} },
      moderationQuestionsRepository: { countWhere: async filters => (filters.talkKey.endsWith("|ia") ? 4 : 0) },
      eventStatsRepository: { get: async () => ({ total: 321 }) },
      firebaseClient: { ensureAnonymousUid: async () => "uid" },
      resolveNow: () => () => new Date("2026-11-28T12:10:00Z"), // 09:10 locais, 1ª palestra no ar (no navegador vem do app.js, que não roda aqui)
      fetch: async url => ({ ok: true, json: async () => ({ title: String(url), photos: [{ id: "p1", url: "https://lh3.googleusercontent.com/pw/p1", width: 4000, height: 3000, addedAt: 1 }] }) }),
    },
  });
  site.run(PAGE, "pages/admin.js");
  return { site, controlListeners, hiddenListeners, body: site.document.getElementById("adminBody") };
}

test("a página admin.html: a seção Telão traz o controle do telão SEM um segundo login nem título repetido, e sair da seção desliga a escuta", async () => {
  const { site, controlListeners, body } = bootAdminPage("#telao");
  await waitFor(() => body.querySelector("[data-notice-publish]"));
  assert.equal(body.querySelectorAll("[data-mod-signin]").length, 0);
  assert.equal(body.querySelectorAll(".mod-account").length, 1, "uma conta só, a do casco");
  assert.equal(body.querySelectorAll("h1").length, 1, "um título só, o do casco");
  assert.equal(body.querySelector("[data-admin-title]").textContent, "Telão");
  assert.deepEqual(controlListeners, ["current"]);
  site.window.location.hash = "#atalhos";
  site.window.dispatchEvent(new site.window.Event("hashchange"));
  assert.equal(controlListeners.length, 0, "a escuta do controle do telão foi desligada ao sair da seção");
  site.window.close();
});

test("a página admin.html: a seção Fotos lê o álbum ao vivo pelo intermediário e escuta a lista de fotos fora do ar", async () => {
  const { site, hiddenListeners, body } = bootAdminPage("#fotos");
  await waitFor(() => body.querySelectorAll(".mf-tile").length === 1);
  assert.deepEqual(hiddenListeners, ["ao-vivo"]);
  assert.equal(body.querySelectorAll("[data-mod-signin]").length, 0);
  assert.equal(body.querySelectorAll("h1").length, 1);
  assert.match(textOf(body), /As 1 fotos mais novas/);
  site.window.close();
});

test("a página admin.html: a visão geral abre por padrão com os 5 cartões do dado, cada um com o seu número, e sair da seção desliga as escutas", async () => {
  const { site, controlListeners, hiddenListeners, body } = bootAdminPage("");
  await waitFor(() => body.querySelectorAll("[data-card]").length === 5 && !/Carregando/.test(textOf(body)));
  assert.deepEqual([...body.querySelectorAll("[data-card]")].map(card => card.dataset.card), ["control", "rooms", "pending", "photos", "registered"]);
  const card = id => textOf(body.querySelector(`[data-card="${id}"]`));
  assert.match(card("control"), /Telão normal/);
  assert.match(card("rooms"), /4 de 4 com palestra no ar/);
  assert.match(card("pending"), /4 na fila/);
  assert.match(card("photos"), /1 foto\(s\)/);
  assert.match(card("registered"), /321/);
  assert.equal(body.querySelector("[data-admin-title]").textContent, "Visão geral");
  assert.deepEqual(controlListeners, ["current"]);
  assert.deepEqual(hiddenListeners, ["ao-vivo"]);
  site.window.location.hash = "#atalhos";
  site.window.dispatchEvent(new site.window.Event("hashchange"));
  assert.equal(controlListeners.length, 0);
  assert.equal(hiddenListeners.length, 0);
  site.window.close();
});

test("equipe.html leva pra área de admin (Atalhos)", () => {
  const html = fs.readFileSync(path.join(DOCS, "equipe.html"), "utf8");
  assert.match(html, /url=admin\.html#atalhos/);
  assert.match(html, /noindex/);
});
