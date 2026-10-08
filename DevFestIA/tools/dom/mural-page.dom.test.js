/**
 * Teste de INTEGRAÇÃO da página do mural (docs/mural.html + js/pages/mural.js, a raiz de composição): carrega os scripts do próprio mural.html
 * na ordem dele (então confere também que a lista de scripts da página está completa), troca Firebase, rede e imagem por substitutos e confere o que
 * o telão faz: rodar o rodízio, mostrar dado ao vivo, comemorar o pódio publicado AO VIVO, sobreviver a uma cena quebrada e avisar queda de internet.
 *   node --test DevFestIA/tools/dom/mural-page.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, waitFor, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const HTML = fs.readFileSync(path.join(DOCS, "mural.html"), "utf8");

/** Os scripts COMUNS do mural.html, na ordem (os módulos do Firebase e a biblioteca de QR do CDN entram como substitutos; a partida da página fica por último). */
const SCRIPTS = [...HTML.matchAll(/<script src="(js\/[^"?]+)[^"]*"/g)].map(match => match[1].replace("js/", "").replace("data/schedule.dev.js", "data/schedule.js")).filter(file => file !== "pages/mural.js");
const PAGE = fs.readFileSync(path.join(DOCS, "js", "pages", "mural.js"), "utf8");

const BODY = `<!doctype html><html><body><div class="mural-backdrop"><div class="mural-stage" id="muralStage"><main id="muralContent"></main><footer id="muralFooter"></footer><aside id="muralDiag" hidden></aside></div></div></body></html>`;

/** Sobe a página com tudo de fora substituído. `search` = parâmetros de URL; `overrides` ajusta o que pode mudar (rede, QR, registered). */
function boot({ search, qr = true, internet = () => true, registered = { total: 120 }, initialPodium = null }) {
  const contestListeners = new Map();
  const globals = {
    QRCode: qr ? function QRCode(el, options) { el.dataset.qrText = options.text; el.innerHTML = "<img>"; } : undefined,
    Image: class { set src(url) { setTimeout(() => this.onload?.(), 0); } },
    fetch: async url => {
      if (!internet()) throw new Error("sem internet");
      return { ok: true, text: async () => HTML };
    },
    firebaseClient: { ensureAnonymousUid: async () => "uid" },
    eventStatsRepository: { get: async () => registered },
    contestResultsRepository: { listen: (key, onNext) => { contestListeners.set(key, onNext); onNext(initialPodium ? { podium: initialPodium } : null); return () => contestListeners.delete(key); } },
  };
  const site = loadSite({ scripts: SCRIPTS, html: BODY, url: `http://localhost/mural.html?lineup=1&demo=2026-11-28T09:10&${search}`, globals });
  // tempos curtos (o rodízio roda no relógio real aqui) e papel picado espiado
  site.run(`
    MURAL_SCENES.forEach(scene => { scene.seconds = 0.15; });
    Object.assign(MURAL_CONFIG, { transitionMs: 20, retryDelayMs: 10, clockEveryMs: 20, reserveSeconds: 0.15, failureCooldownMs: 50, skipCooldownMs: 50, kioskEnsureEveryMs: 1000000, health: { ...MURAL_CONFIG.health, versionCheckEveryMs: 1000000 } });
    Object.assign(MURAL_CONFIG.network, { probeEveryMs: 25, backoff: { baseMs: 20, maxMs: 40, factor: 1, jitter: 0 } });
    Object.assign(MURAL_CONFIG.motion, { countUpMs: 60, countUpStepMs: 20 });
    MURAL_SOURCES.find(source => source.id === "podium").bind.celebrateDelayMs = 30;
    globalThis.__confetti = 0;
    createConfetti = () => ({ fire: () => { __confetti++; return true; } });
  `);
  site.run(PAGE, "pages/mural.js");
  const document = site.document;
  return {
    site, document, contestListeners,
    active: () => document.querySelector(".mural-scene.is-active")?.dataset.scene ?? null,
    activeText: () => textOf(document.querySelector(".mural-scene.is-active") ?? document.body),
    confetti: () => site.run("__confetti"),
    footer: () => document.getElementById("muralFooter"),
  };
}

test("a página sobe e roda o rodízio: 'agora e próximas' com a grade, e a tela de partida some", async () => {
  const page = boot({ search: "cenas=agora" });
  await waitFor(() => page.active() === "agora");
  assert.match(page.activeText(), /Agora no DevFest/);
  assert.equal(page.document.querySelector('[data-scene="boot"]'), null, "a tela de partida saiu");
  assert.equal(page.document.getElementById("muralStage").dataset.shape !== undefined, true);
  await waitFor(() => /\d{2}:\d{2}/.test(textOf(page.footer())));
  page.site.window.close();
});

test("o line-up só aparece revelado: sem ?lineup=1 a cena 'agora' (dado mock) não entra e a reserva sustenta a tela", async () => {
  const dom = loadSite({ scripts: SCRIPTS, html: BODY, url: "http://localhost/mural.html?cenas=agora&ensaio=0&demo=2026-11-28T09:10", globals: { fetch: async () => ({ ok: true, text: async () => HTML }), Image: class { set src(url) { setTimeout(() => this.onload?.(), 0); } } } });
  dom.run("Object.assign(MURAL_CONFIG, { reserveSeconds: 0.15 }); MURAL_CONFIG.network.probeEveryMs = 1000000;");
  dom.run(PAGE, "pages/mural.js");
  await waitFor(() => dom.document.querySelector(".mural-scene.is-active")?.dataset.scene === "reserva");
  assert.equal(dom.document.querySelector('[data-scene="agora"]'), null);
  dom.window.close();
});

test("dado ao vivo: o total de inscritos lido do banco aparece na cena de inscritos", async () => {
  const page = boot({ search: "cenas=inscritos" });
  await waitFor(() => page.active() === "inscritos");
  await waitFor(() => /120/.test(page.activeText()), { timeout: 3000 }); // o número sobe de 0 até o total
  assert.match(page.activeText(), /120/);
  assert.match(page.activeText(), /Já garantiram a vaga/);
  page.site.window.close();
});

test("inscritos abaixo do mínimo não viram cena (a reserva segura a tela, sem falha)", async () => {
  const page = boot({ search: "cenas=inscritos", registered: { total: 3 } });
  await waitFor(() => page.active() === "reserva");
  assert.equal(page.document.querySelector('[data-scene="inscritos"]'), null);
  page.site.window.close();
});

const PODIUM = [{ place: 1, project: "Projeto Foguete", name: "Ana Souza" }, { place: 2, project: "App Bússola", name: "Beto Lima" }];

test("pódio publicado AO VIVO: entra na frente do rodízio na hora e dispara o papel picado", async () => {
  const page = boot({ search: "cenas=qr-cartao,podio-jam" });
  await waitFor(() => page.active() === "qr-cartao");
  assert.equal(page.contestListeners.size, 1, "uma escuta, na sessão do Coding Jam");
  const [key, emit] = [...page.contestListeners][0];
  assert.match(key, /\|ia$/);
  assert.equal(page.document.querySelector('[data-scene="podio-jam"]'), null, "sem pódio, a cena não entra no rodízio");

  emit({ podium: PODIUM });
  await waitFor(() => page.active() === "podio-jam");
  assert.match(page.activeText(), /Projeto Foguete/);
  assert.match(page.activeText(), /Ana Souza/);
  assert.match(page.activeText(), /O pódio chegou/);
  assert.equal(page.confetti(), 0, "a festa espera o 1º lugar entrar");
  await waitFor(() => page.confetti() === 1);
  page.site.window.close();
});

test("pódio que JÁ estava publicado quando o mural abriu: entra no rodízio, mas sem papel picado", async () => {
  const page = boot({ search: "cenas=qr-cartao,podio-jam", initialPodium: PODIUM });
  await waitFor(() => page.active() === "podio-jam");
  assert.match(page.activeText(), /Projeto Foguete/);
  assert.equal(page.confetti(), 0);
  page.site.window.close();
});

test("cena quebrada não derruba o rodízio: sem a biblioteca de QR a cena de QR falha, descansa, e as outras seguem", async () => {
  const page = boot({ search: "cenas=qr-cartao,dicas", qr: false });
  await waitFor(() => page.active() === "dicas");
  assert.match(page.activeText(), /Aproveite o DevFest/);
  await waitFor(() => page.document.querySelector('[data-scene="dicas"]'));
  assert.equal(page.document.querySelector('[data-scene="qr-cartao"]'), null);
  page.site.window.close();
});

test("QR gigante: o endereço do QR é o do site e leva o ensaio junto", async () => {
  const page = boot({ search: "cenas=qr-cartao&ensaio=0" });
  await waitFor(() => page.document.querySelector("[data-qr-text]"));
  assert.equal(page.document.querySelector("[data-qr-text]").dataset.qrText, "https://gdgcampinas.github.io/DevFest-Campinas-2026/ingressos.html?cartao=1");
  page.site.window.close();
});

test("queda de internet: o rodapé avisa, o mural segue rodando com o que tem, e o aviso some quando a rede volta", async () => {
  let internet = true;
  const page = boot({ search: "cenas=dicas", internet: () => internet });
  await waitFor(() => page.active() === "dicas");
  const status = () => page.footer().querySelector("[data-status]");
  await waitFor(() => status() && status().hidden === true);
  internet = false;
  await waitFor(() => status().hidden === false);
  assert.equal(page.active() !== null, true, "o mural continua com algo na tela");
  internet = true;
  await waitFor(() => status().hidden === true);
  page.site.window.close();
});

test("diagnóstico (?diag=1) mostra a saúde do mural", async () => {
  const page = boot({ search: "cenas=dicas&diag=1" });
  const diag = page.document.getElementById("muralDiag");
  await waitFor(() => /Cenas mostradas/.test(textOf(diag)) && /registered: live/.test(textOf(diag)));
  assert.equal(diag.hidden, false);
  assert.match(textOf(diag), /Degradado\s*não/);
  page.site.window.close();
});
