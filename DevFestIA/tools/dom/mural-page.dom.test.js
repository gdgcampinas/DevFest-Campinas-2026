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
function boot({ search, demo = "2026-11-28T09:10", qr = true, internet = () => true, registered = { total: 120 }, initialPodium = null, albums = null, initialControl = null }) {
  const contestListeners = new Map();
  const hiddenListeners = new Map();
  const controlListeners = new Map();
  const globals = {
    QRCode: qr ? function QRCode(el, options) { el.dataset.qrText = options.text; el.innerHTML = "<img>"; } : undefined,
    Image: class { set src(url) { setTimeout(() => this.onload?.(), 0); } },
    fetch: async url => {
      if (!internet()) throw new Error("sem internet");
      if (String(url).includes("proxy.test/albums/")) { // intermediário de álbuns de mentira
        const body = albums?.[decodeURIComponent(String(url).split("/albums/")[1])];
        return body ? { ok: true, status: 200, json: async () => ({ ...body, photos: [...body.photos] }) } : { ok: false, status: 404, json: async () => ({}) };
      }
      if (String(url).startsWith("https://media.test/")) return { ok: true, status: 200, clone() { return this; }, blob: async () => ({}) }; // clipes de vídeo de mentira
      return { ok: true, text: async () => HTML };
    },
    firebaseClient: { ensureAnonymousUid: async () => "uid" },
    eventStatsRepository: { get: async () => registered },
    muralHiddenRepository: { listen: (key, onNext) => { hiddenListeners.set(key, onNext); onNext(null); return () => hiddenListeners.delete(key); } },
    muralControlRepository: { listen: (key, onNext) => { controlListeners.set(key, onNext); onNext(initialControl); return () => controlListeners.delete(key); } },
    contestResultsRepository: { listen: (key, onNext) => { contestListeners.set(key, onNext); onNext(initialPodium ? { podium: initialPodium } : null); return () => contestListeners.delete(key); } },
  };
  const site = loadSite({ scripts: SCRIPTS, html: BODY, url: `http://localhost/mural.html?lineup=1&demo=${demo}&${search}`, globals });
  // tempos curtos (o rodízio roda no relógio real aqui) e papel picado espiado
  site.run(`
    MURAL_SCENES.forEach(scene => { scene.seconds = 0.15; });
    Object.assign(MURAL_CONFIG, { transitionMs: 20, retryDelayMs: 10, clockEveryMs: 20, reserveSeconds: 0.15, idleRetryMs: 50, failureCooldownMs: 50, skipCooldownMs: 50, waitCooldownMs: 50, kioskEnsureEveryMs: 1000000, health: { ...MURAL_CONFIG.health, versionCheckEveryMs: 1000000 } });
    Object.assign(MURAL_CONFIG.network, { probeEveryMs: 25, backoff: { baseMs: 20, maxMs: 40, factor: 1, jitter: 0 } });
    Object.assign(MURAL_CONFIG.motion, { countUpMs: 60, countUpStepMs: 20 });
    MURAL_ALBUMS.forEach(album => { album.pollMs = 40; });
    MURAL_CONFIG.holdCheckMs = 30;
    URL.createObjectURL = () => "blob:clipe";
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
    MURAL_CONFIG.albums.proxyUrl = ""; // os testes ligam o intermediário (de mentira) só com ?albuns=, nunca o de produção
    MURAL_SOURCES.find(source => source.id === "podium").bind.celebrateDelayMs = 30;
    globalThis.__confetti = 0;
    createConfetti = () => ({ fire: () => { __confetti++; return true; } });
  `);
  site.run(PAGE, "pages/mural.js");
  const document = site.document;
  return {
    site, document, contestListeners, hiddenListeners, controlListeners,
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

test("a arte do convite abre o mural ANTES do evento e não entra durante ele (a reserva segura a tela)", async () => {
  const before = boot({ search: "cenas=abertura", demo: "2026-11-20T09:10" });
  await waitFor(() => before.active() === "abertura");
  assert.equal(before.document.querySelector("img.ms-art-img").getAttribute("src"), "assets/img/mural-art-invite.webp?v=1");
  before.site.window.close();
  const during = boot({ search: "cenas=abertura" });
  await waitFor(() => during.active() === "reserva");
  assert.equal(during.document.querySelector('[data-scene="abertura"]'), null);
  during.site.window.close();
});

test("selfie na página: arte do pôr do sol de fundo, sem frase de apoio", async () => {
  const page = boot({ search: "cenas=selfie" });
  await waitFor(() => page.active() === "selfie");
  assert.equal(page.document.querySelector(".ms-art-img").getAttribute("src"), "assets/img/mural-art-sunset.webp?v=1");
  assert.ok(!/Tire sua foto/.test(page.activeText()));
  page.site.window.close();
});

const albumPhoto = (id, width = 4000, height = 3000) => ({ id, url: `https://lh3.googleusercontent.com/pw/${id}`, width, height, takenAt: 1, addedAt: 1 });
const albumBody = (title, ids, size) => ({ title, fetchedAt: 1, count: ids.length, photos: ids.map(id => albumPhoto(id, ...(size ?? []))) });

test("álbuns: com o intermediário ligado (?albuns=) a cena mostra as fotos do álbum, no modelo e no tamanho certos", async () => {
  const albums = { "ao-vivo": albumBody("Ao vivo", ["a", "b", "c", "d", "e", "f", "g"]) };
  const page = boot({ search: "cenas=album-ao-vivo&albuns=https://proxy.test", albums });
  await waitFor(() => page.active() === "album-ao-vivo");
  const imgs = [...page.document.querySelectorAll(".mural-scene.is-active .ms-album-tile img")].map(img => img.getAttribute("src"));
  assert.equal(imgs.length, 6, "colagem de 6 (álbum de paisagens)");
  assert.ok(imgs.every(src => /^https:\/\/lh3\.googleusercontent\.com\/pw\/[a-g]=w960-h640$/.test(src)), imgs.join(" "));
  assert.match(page.activeText(), /DevFest 2026 ao vivo/);
  assert.ok(page.document.querySelector(".ms-live-dot"));
  page.site.window.close();
});

test("álbuns: álbum de retratos vira faixa de retratos (o do Elotech Agibank é 93% retrato)", async () => {
  const albums = { "elotech-agibank": albumBody("Elotech Agibank", ["p1", "p2", "p3", "p4", "p5"], [3000, 5333]) };
  const page = boot({ search: "cenas=album-elotech&albuns=https://proxy.test", albums });
  await waitFor(() => page.active() === "album-elotech");
  assert.ok(page.document.querySelector(".ms-album--strip"));
  assert.equal(page.document.querySelectorAll(".ms-album-tile").length, 4);
  page.site.window.close();
});

test("álbuns: sem o intermediário ligado nenhuma cena de álbum aparece e o mural segue com o resto", async () => {
  const page = boot({ search: "cenas=album-ao-vivo,dicas" });
  await waitFor(() => page.active() === "dicas");
  assert.equal(page.document.querySelector('[data-scene="album-ao-vivo"]'), null);
  page.site.window.close();
});

test("álbuns: intermediário fora do ar sem lista guardada: o mural não quebra e segue com as outras cenas", async () => {
  const page = boot({ search: "cenas=album-ao-vivo,dicas&diag=1&albuns=https://proxy.test", albums: {} });
  await waitFor(() => page.active() === "dicas");
  assert.equal(page.document.querySelector('[data-scene="album-ao-vivo"]'), null);
  await waitFor(() => /album-live:ao-vivo: retrying/.test(textOf(page.document.getElementById("muralDiag"))), { timeout: 4000 }); // a fonte tenta de novo com espera crescente
  page.site.window.close();
});

test("foto escondida pelo moderador some do telão (a lista vem do banco por escuta) e volta quando o moderador a devolve", async () => {
  const albums = { "ao-vivo": albumBody("Ao vivo", ["a", "b", "c", "d", "e", "f"]) };
  const page = boot({ search: "cenas=album-ao-vivo&albuns=https://proxy.test", albums });
  await waitFor(() => page.active() === "album-ao-vivo");
  const shown = () => [...page.document.querySelectorAll(".mural-scene.is-active .ms-album-tile img")].map(img => img.getAttribute("src").match(/pw\/(\w)=/)[1]).sort().join("");
  await waitFor(() => shown() === "abcdef");
  page.hiddenListeners.get("ao-vivo")({ ids: ["a", "c"] });
  await waitFor(() => shown() === "bdef");
  page.hiddenListeners.get("ao-vivo")({ ids: [] });
  await waitFor(() => shown() === "abcdef");
  page.site.window.close();
});

test("foto nova no álbum ao vivo: entra em destaque na frente do rodízio com o selo; as que já estavam lá não viram destaque", async () => {
  const albums = { "ao-vivo": albumBody("Ao vivo", ["a", "b", "c"]) };
  const page = boot({ search: "cenas=dicas,foto-nova&albuns=https://proxy.test", albums });
  await waitFor(() => page.document.querySelector('[data-scene="dicas"]'));
  await new Promise(resolve => setTimeout(resolve, 150)); // algumas leituras do álbum sem novidade
  assert.equal(page.document.querySelector('[data-scene="foto-nova"]'), null, "as 3 fotos que já estavam lá não são novas");
  albums["ao-vivo"] = albumBody("Ao vivo", ["NOVA", "a", "b", "c"]);
  await waitFor(() => page.active() === "foto-nova");
  assert.equal(page.document.querySelector(".ms-album--feature .ms-album-tile img").getAttribute("src"), "https://lh3.googleusercontent.com/pw/NOVA=w1400-h1000", "a nova é a grande, com mais 3 ao lado");
  assert.match(page.activeText(), /Nova foto da galera/);
  page.site.window.close();
});

test("agradecimento aos patrocinadores: só no almoço e no encerramento da grade (o momento vem da grade, não de um horário solto)", async () => {
  const lunch = boot({ search: "cenas=agradecimento-patrocinio,dicas", demo: "2026-11-28T12:30" });
  await waitFor(() => lunch.active() === "agradecimento-patrocinio");
  assert.match(lunch.activeText(), /Muito obrigado/);
  lunch.site.window.close();
  const talk = boot({ search: "cenas=agradecimento-patrocinio,dicas", demo: "2026-11-28T10:00" });
  await waitFor(() => talk.active() === "dicas");
  assert.equal(talk.document.querySelector('[data-scene="agradecimento-patrocinio"]'), null, "em horário de palestra não entra");
  talk.site.window.close();
  const closing = boot({ search: "cenas=agradecimento-patrocinio,dicas", demo: "2026-11-28T17:30" });
  await waitFor(() => closing.active() === "agradecimento-patrocinio");
  closing.site.window.close();
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

/** O QR de avaliar só entra depois das 17:15, então estes testes usam um relógio simulado dessa hora. */
const AFTER_FEEDBACK_OPENS = "2026-11-28T17:30";
const PODIUM = [{ place: 1, project: "Projeto Foguete", name: "Ana Souza" }, { place: 2, project: "App Bússola", name: "Beto Lima" }];

test("pódio publicado AO VIVO: entra na frente do rodízio na hora e dispara o papel picado", async () => {
  const page = boot({ search: "cenas=qr-avaliar,podio-jam", demo: AFTER_FEEDBACK_OPENS });
  await waitFor(() => page.active() === "qr-avaliar");
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
  const page = boot({ search: "cenas=qr-avaliar,podio-jam", demo: AFTER_FEEDBACK_OPENS, initialPodium: PODIUM });
  await waitFor(() => page.active() === "podio-jam");
  assert.match(page.activeText(), /Projeto Foguete/);
  assert.equal(page.confetti(), 0);
  page.site.window.close();
});

test("cena quebrada não derruba o rodízio: sem a biblioteca de QR a cena de QR falha, descansa, e as outras seguem", async () => {
  const page = boot({ search: "cenas=qr-avaliar,dicas", demo: AFTER_FEEDBACK_OPENS, qr: false });
  await waitFor(() => page.active() === "dicas");
  assert.match(page.activeText(), /Aproveite o DevFest/);
  await waitFor(() => page.document.querySelector('[data-scene="dicas"]'));
  assert.equal(page.document.querySelector('[data-scene="qr-avaliar"]'), null);
  page.site.window.close();
});

test("QR gigante: o endereço do QR é o do site e leva o ensaio junto", async () => {
  const page = boot({ search: "cenas=qr-avaliar&ensaio=0", demo: AFTER_FEEDBACK_OPENS });
  await waitFor(() => page.document.querySelector("[data-qr-text]"));
  assert.equal(page.document.querySelector("[data-qr-text]").dataset.qrText, "https://gdgcampinas.github.io/DevFest-Campinas-2026/index.html?avaliar=1");
  page.site.window.close();
});

test("QR do álbum ao vivo: leva ao convite pelo intermediário (o link do álbum nunca está no site) e só aparece com o intermediário ligado", async () => {
  const albums = { "ao-vivo": albumBody("Ao vivo", ["a", "b", "c", "d"]) };
  const page = boot({ search: "cenas=qr-album&albuns=https://proxy.test", albums });
  await waitFor(() => page.active() === "qr-album");
  assert.equal(page.document.querySelector("[data-qr-text]").dataset.qrText, "https://proxy.test/join/ao-vivo");
  assert.match(page.activeText(), /Mande sua foto/);
  assert.equal(page.document.querySelector(".mural-scene.is-active .ms-url"), null);
  page.site.window.close();
  const off = boot({ search: "cenas=qr-album,dicas", albums: {} });
  await waitFor(() => off.active() === "dicas");
  assert.equal(off.document.querySelector('[data-scene="qr-album"]'), null);
  off.site.window.close();
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

// ---------- controle remoto ----------
const control = (extra = {}) => ({ notices: [], emergency: null, hold: null, reload: 0, ...extra });
const inMinutes = minutes => Date.now() + minutes * 60000;

test("aviso do moderador: entra na frente do rodízio na hora, escapado, e some sozinho quando vence", async () => {
  const page = boot({ search: "cenas=dicas,aviso" });
  await waitFor(() => page.active() === "dicas");
  assert.equal(page.document.querySelector('[data-scene="aviso"]'), null, "sem aviso a cena não entra");
  const emit = page.controlListeners.get("current");
  emit(control({ notices: [{ id: "n1", text: "Achado e perdido: <b>chave azul</b>", kind: "alert", until: inMinutes(5) }] }));
  await waitFor(() => page.active() === "aviso");
  assert.match(page.activeText(), /Achado e perdido: <b>chave azul<\/b>/);
  assert.equal(page.document.querySelector(".mural-scene.is-active b"), null);
  emit(control({ notices: [{ id: "n1", text: "x", until: Date.now() + 120 }] }));
  await waitFor(() => page.document.querySelector('.mural-scene.is-active[data-scene="dicas"]') && !page.document.querySelector('.mural-scene.is-active[data-scene="aviso"]'), { timeout: 3000 });
  page.site.window.close();
});

test("fixar e pausar: o telão para na cena pedida (ou na que estava) até soltar; soltar volta a rodar", async () => {
  const page = boot({ search: "cenas=dicas,inscritos,agora" });
  await waitFor(() => page.active() !== null);
  const emit = page.controlListeners.get("current");
  emit(control({ hold: { sceneId: "dicas", until: inMinutes(10) } }));
  await waitFor(() => page.active() === "dicas");
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.equal(page.active(), "dicas", "ficou parado, mesmo com o tempo de tela de 0,15 s");
  emit(control());
  await waitFor(() => page.active() !== "dicas", { timeout: 3000 });
  page.site.window.close();
});

test("EMERGÊNCIA: tela cheia com o texto, o rodízio para, nenhum pódio ou aviso corta, e ao desarmar o telão volta", async () => {
  const page = boot({ search: "cenas=dicas,inscritos" });
  await waitFor(() => page.active() !== null);
  const emit = page.controlListeners.get("current");
  emit(control({ emergency: { text: "Evacuação: sigam as saídas de emergência", since: Date.now() } }));
  await waitFor(() => page.active() === "emergencia");
  assert.match(page.activeText(), /Evacuação: sigam as saídas de emergência/);
  const [, podium] = [...page.contestListeners][0];
  podium({ podium: PODIUM });
  emit(control({ emergency: { text: "Evacuação: sigam as saídas de emergência", since: Date.now() }, notices: [{ id: "n", text: "outro", until: inMinutes(5) }] }));
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.equal(page.active(), "emergencia", "nada corta a emergência");
  emit(control());
  await waitFor(() => page.active() !== "emergencia", { timeout: 3000 });
  page.site.window.close();
});

test("recarregar pelo celular: a primeira leitura é só o ponto de partida; pedido novo recarrega UMA vez e fica guardado (sem laço)", async () => {
  const page = boot({ search: "cenas=dicas" });
  await waitFor(() => page.active() === "dicas");
  const emit = page.controlListeners.get("current");
  const saved = () => JSON.parse(page.site.window.sessionStorage.getItem("devfest-campinas-2026:mural") ?? "{}");
  assert.equal(saved().controlToken, 0, "a primeira leitura (documento ainda vazio) virou o ponto de partida");
  emit(control({ notices: [] }));
  assert.ok(!saved().lastReason, "e leitura sem pedido novo não recarrega");
  emit(control({ reload: 222 }));
  assert.equal(saved().controlToken, 222);
  assert.equal(saved().lastReason, "remote-reload", "recarregou, e o motivo ficou registrado");
  assert.equal(saved().reloads.length, 1);
  emit(control({ reload: 222 }));
  assert.equal(saved().reloads.length, 1, "o mesmo pedido lido de novo não recarrega outra vez");
  page.site.window.close();
});

test("vídeo: com o endereço dos clipes (?videos=) baixa antes, entra no rodízio com o tempo do clipe e toca mudo em horário de palestra; sem endereço a cena não aparece", async () => {
  const page = boot({ search: "cenas=video-2025,dicas&videos=https://media.test/" });
  await waitFor(() => page.active() === "video-2025", { timeout: 3000 });
  const video = page.document.querySelector(".mural-scene.is-active video");
  assert.equal(video.getAttribute("src"), "blob:clipe");
  assert.equal(video.hasAttribute("muted"), true, "09:10 é horário de palestra: mudo");
  assert.match(page.activeText(), /DevFest 2025/);
  const scene = page.site.run("muralScenesRepository.getAll().find(s => s.id === 'video-2025').seconds");
  assert.equal(scene, 0.15, "o dado da cena tem tempo curto no teste, mas o vídeo manda no próprio tempo de tela");
  assert.ok(Number(page.document.querySelector(".mural-scene.is-active").style.getPropertyValue("--scene-ms")) > 5000);
  page.site.window.close();
  const off = boot({ search: "cenas=video-2025,dicas" });
  await waitFor(() => off.active() === "dicas");
  assert.equal(off.document.querySelector('[data-scene="video-2025"]'), null, "sem intermediário e sem ?videos= não há de onde baixar");
  off.site.window.close();
});

test("vídeo: hoje toca SEMPRE mudo (o som foi desligado pelo Renato), e as cenas de intervalo só existem no almoço e no encerramento", async () => {
  const lunch = boot({ search: "cenas=video-2025-intervalo&videos=https://media.test/", demo: "2026-11-28T12:30" });
  await waitFor(() => lunch.active() === "video-2025-intervalo", { timeout: 3000 });
  assert.equal(lunch.document.querySelector(".mural-scene.is-active video").hasAttribute("muted"), true, "mesmo no almoço: mudo");
  lunch.site.window.close();
  const talk = boot({ search: "cenas=video-2025-intervalo,dicas&videos=https://media.test/", demo: "2026-11-28T10:00" });
  await waitFor(() => talk.active() === "dicas");
  assert.equal(talk.document.querySelector('[data-scene="video-2025-intervalo"]'), null, "em palestra a cena de intervalo não entra");
  talk.site.window.close();
});


test("aviso que já estava no ar quando o mural abre (como depois de uma recarga) aparece na hora, e um pedido de recarregar não tira o aviso do documento", async () => {
  const notice = { id: "n1", text: "Sala B começa em 5 minutos", kind: "info", until: Date.now() + 60000 };
  const page = boot({ search: "cenas=dicas,aviso", initialControl: control({ notices: [notice], reload: 5 }) });
  await waitFor(() => page.active() === "aviso", { timeout: 3000 });
  assert.match(page.activeText(), /Sala B começa em 5 minutos/);
  page.controlListeners.get("current")(control({ notices: [notice], reload: 6 })); // o moderador pede recarga: o aviso continua no documento
  await new Promise(resolve => setTimeout(resolve, 300));
  const saved = JSON.parse(page.site.window.sessionStorage.getItem("devfest-campinas-2026:mural"));
  assert.equal(saved.lastReason, "remote-reload");
  page.site.window.close();
});
