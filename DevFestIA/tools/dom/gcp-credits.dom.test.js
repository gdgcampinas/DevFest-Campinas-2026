/**
 * Testes dos créditos do Google Cloud (docs/js/data/gcp-credits.js, features/gcp-credit-window.js, gcp-credits.js, gcp-credit-poster.js,
 * components/credit-steps.js, credit-link-card.js): o link só aparece dentro da janela, o reserva fica atrás de "Deu problema?", os passos e o cartaz
 * saem do dado, e tudo é só DEV até `public: true`.
 *   node --test --test-force-exit DevFestIA/tools/dom/gcp-credits.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "data/gcp-credits.js", "data/sponsors.js", "data/parallel-sessions.js", "components/parallel-session-card.js", "features/parallel-sessions.js", "features/agenda.js", "components/track-card.js", "components/info-card.js", "components/credit-steps.js", "components/credit-link-card.js", "components/talk-highlight.js", "features/gcp-credit-window.js", "components/modal.js", "features/image-zoom.js", "features/gcp-credits.js", "features/gcp-credit-poster.js"] });
test.after(() => site.window.close());
const config = site.get("gcpCreditsRepository").getAll();
const creditWindowState = site.get("creditWindowState");
const session = site.get("parallelSessionsRepository").getById(config.sessionId);
const mount = () => site.document.body.appendChild(site.document.createElement("div"));
const at = iso => new Date(iso);

test("janela: antes de abrir devolve a próxima; dentro, a janela; depois de tudo, encerrado", () => {
  assert.equal(creditWindowState(config.windows, at("2026-11-28T06:59:00-03:00")).state, "before");
  assert.equal(creditWindowState(config.windows, at("2026-11-28T06:59:00-03:00")).window.id, "day");
  const open = creditWindowState(config.windows, at("2026-11-28T10:00:00-03:00"));
  assert.deepEqual([open.state, open.window.id], ["open", "day"]);
  assert.equal(creditWindowState(config.windows, at("2026-11-28T19:00:00-03:00")).window.id, "night", "a janela da noite começa quando a do dia acaba");
  assert.equal(creditWindowState(config.windows, at("2026-11-29T07:00:00-03:00")).state, "closed");
});

test("horário mostrado no fuso de Campinas, em português e em inglês", () => {
  const format = site.get("formatCreditMoment");
  assert.equal(format("2026-11-28T07:00:00-03:00"), "28/11 às 07:00");
  assert.equal(format("2026-11-28T07:00:00-03:00", { locale: "en-US" }), "11/28 at 07:00");
  assert.equal(format("2026-11-28T10:00:00Z"), "28/11 às 07:00", "o instante em UTC cai no horário daqui");
});

test("antes da janela: mensagem com a data e nenhum link", () => {
  const el = mount();
  site.get("renderGcpCredits")(config, el, { session, now: at("2026-11-20T12:00:00-03:00") });
  assert.match(el.querySelector(".credit-link-msg").textContent, /28\/11 às 07:00/);
  assert.equal(el.querySelectorAll("a[data-credit]").length, 0);
});

test("dentro da janela: link principal e QR visíveis, reserva só dentro de <details>", () => {
  const el = mount();
  site.get("renderGcpCredits")(config, el, { session, now: at("2026-11-28T10:00:00-03:00") });
  const main = el.querySelector(".credit-link-open a[data-credit]");
  assert.equal(main.getAttribute("href"), "https://g.dev/credits/gdg-campinas-4");
  assert.ok(el.querySelector(".credit-qr").getAttribute("src").endsWith("qr-gdg-campinas-4.webp"));
  const backup = el.querySelector("details.credit-backup a[data-credit]");
  assert.equal(backup.getAttribute("href"), "https://g.dev/credits/gdg-campinas-4-bkp");
  assert.match(el.querySelector(".credit-link-until").textContent, /28\/11 às 19:00/);
});

test("à noite vale o par -5 e depois de tudo aparece 'encerrado'", () => {
  const night = mount();
  site.get("renderGcpCredits")(config, night, { session, now: at("2026-11-28T22:00:00-03:00") });
  assert.equal(night.querySelector(".credit-link-open a[data-credit]").getAttribute("href"), "https://g.dev/credits/gdg-campinas-5");
  const closed = mount();
  site.get("renderGcpCredits")(config, closed, { session, now: at("2026-11-30T12:00:00-03:00") });
  assert.equal(closed.querySelectorAll("a[data-credit]").length, 0);
  assert.match(closed.querySelector(".credit-link-msg").textContent, /encerraram/);
});

test("a página mostra a sessão, os requisitos, um passo por tela e os materiais oficiais", () => {
  const el = mount();
  site.get("renderGcpCredits")(config, el, { session, now: at("2026-11-28T10:00:00-03:00") });
  assert.match(el.querySelector(".credit-session").textContent, /Coding Jam.*Laboratório.*1ª rodada, das 10:00 às 12:00/s);
  assert.equal(el.querySelectorAll("#creditRequirements .faq-item").length, config.requirements.length);
  assert.equal(el.querySelectorAll(".credit-step").length, config.steps.length);
  assert.equal([...el.querySelectorAll(".credit-step-num")].map(n => n.textContent).join(), config.steps.map((_, i) => i + 1).join());
  assert.ok([...el.querySelectorAll(".credit-official a")].some(a => a.href === "https://goo.gle/gcpcredits-en"));
});

test("mais de uma rodada vira mais de uma linha", () => {
  const el = mount();
  const two = { ...session, rounds: [{ start: "10:00", end: "12:00" }, { start: "14:00", end: "16:00" }] };
  site.get("renderGcpCredits")(config, el, { session: two, now: at("2026-11-28T10:00:00-03:00") });
  assert.match(el.querySelector(".credit-session").textContent, /2ª rodada, das 14:00 às 16:00/);
});

test("cartaz: QR da janela escolhida, passos compactos (sem texto) e o endereço do site", () => {
  const el = mount();
  site.get("renderGcpPoster")(config, el, { session, windowId: "night", siteUrl: "exemplo.com/creditos.html" });
  assert.ok(el.querySelector(".credit-poster-qr img").getAttribute("src").endsWith("qr-gdg-campinas-5.webp"));
  assert.equal(el.querySelectorAll(".credit-steps--compact .credit-step").length, config.steps.length);
  assert.equal(el.querySelectorAll(".credit-steps--compact p").length, 0);
  assert.match(el.querySelector(".credit-poster-foot").textContent, /exemplo\.com\/creditos\.html/);
  const fallback = mount();
  site.get("renderGcpPoster")(config, fallback, { session });
  assert.ok(fallback.querySelector(".credit-poster-qr img").getAttribute("src").endsWith("qr-gdg-campinas-4.webp"), "sem janela escolhida, a primeira");
});

test("só DEV: o card de 'Antes de vir' e o botão do Coding Jam somem enquanto `public` é falso", () => {
  const card = site.get("gcpCreditsInfoCard");
  assert.equal(config.public, false);
  assert.equal(card(config, { devMode: false }), null);
  assert.equal(card(config, { devMode: true }).href, "creditos.html");
  assert.equal(card({ ...config, public: true }, { devMode: false }).href, "creditos.html");
  assert.equal(session.public, false);
  const action = site.get("talkHighlightsRepository").getAll().find(h => h.id === "codejam").action;
  const markup = site.get("talkHighlightActionMarkup");
  assert.equal(markup(action, { devMode: false }), "");
  assert.match(markup(action, { devMode: true }), /href="creditos\.html"/);
  assert.match(markup({ ...action, public: true }, { devMode: false }), /Ver como resgatar/);
});

test("o dado é coerente: links do Google, QR e telas existem, cada janela tem principal e reserva", () => {
  config.windows.forEach(window => {
    assert.ok(Date.parse(window.start) < Date.parse(window.end));
    for (const link of [window.primary, window.backup]) {
      assert.match(link.url, /^https:\/\/g\.dev\/credits\/gdg-campinas-/);
      assert.ok(link.url.endsWith(link.code));
      assert.ok(fs.existsSync(path.join(DOCS, link.qr)), link.qr);
    }
    assert.equal(window.backup.code, `${window.primary.code}-bkp`);
  });
  config.steps.forEach(step => assert.ok(fs.existsSync(path.join(DOCS, step.image)), step.image));
});

// ---- sessão em paralelo na grade (data/parallel-sessions.js) ----
const slot = (hhmm, end, banner) => ({ start: new Date(`2026-11-28T${hhmm}:00-03:00`), end: new Date(`2026-11-28T${end}:00-03:00`), banner });
const SCHEDULE_STUB = [slot("09:00", "09:40", "Palestras 1"), slot("09:45", "10:25", "Palestras 2"), slot("10:30", "11:10", "Palestras 3"), slot("11:15", "11:55", "Palestras 4"), slot("13:30", "14:10", "Palestras 5")];
const toDate = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);
const findHost = name => site.get("sponsorsRepository").findByName(name);
const findHighlight = id => site.get("talkHighlightsRepository").getById(id);
const placementsOf = (sessions, options = { findHost, findHighlight }) => site.get("parallelPlacements")(sessions, SCHEDULE_STUB, toDate, options);
const textsOf = () => site.get("parallelSessionsRepository").texts();

test("a rodada cobre as sessões que começam dentro dela (10:00-12:00 cobre 10:30 e 11:15)", () => {
  const [placement] = placementsOf([session]);
  assert.deepEqual([placement.from, placement.to], [2, 3]);
});

test("rodada sem sessão dentro: faixa vazia, o card entra antes da primeira que começa depois (ou no fim)", () => {
  const [gap] = placementsOf([{ ...session, rounds: [{ start: "12:00", end: "13:00" }] }]);
  assert.deepEqual([gap.from, gap.to], [4, 3], "antes da das 13:30, sem cobrir nenhuma");
  const [late] = placementsOf([{ ...session, rounds: [{ start: "15:00", end: "16:00" }] }]);
  assert.deepEqual([late.from, late.to], [SCHEDULE_STUB.length, SCHEDULE_STUB.length - 1]);
});

test("mais de uma rodada: um card por rodada, ordenadas pelo horário; cada uma com o seu rótulo", () => {
  const two = { ...session, rounds: [{ start: "11:00", end: "12:00" }, { start: "09:00", end: "09:30" }] };
  const placements = placementsOf([two]);
  assert.equal(placements.map(p => p.round.start).join(), "09:00,11:00");
  assert.equal(site.get("parallelRoundLines")(two, "{n}ª, {start}-{end}").join("|"), "1ª, 11:00-12:00|2ª, 09:00-09:30");
});

test("a marca que faz o lab vem de data/sponsors.js (Liga de TI PUC), com logo e links", () => {
  const [placement] = placementsOf([session]);
  assert.equal(placement.host.name, "Liga de TI PUC");
  assert.ok(placement.host.logo.endsWith("liga-de-ti-puc.webp"));
  assert.equal(placement.host.link, "https://linktr.ee/ligadetipuccampinas");
  assert.equal(placement.host.instagram, "https://www.instagram.com/ligadetipucc");
  assert.equal(placementsOf([session], {})[0].host, null, "sem marca achada, o card sai sem o bloco de quem faz");
});

test("a grade põe o card alto ao lado das sessões que ele cobre, sem mexer na ordem nem no índice", () => {
  const el = mount();
  site.get("renderAgenda")(SCHEDULE_STUB, [], "America/Sao_Paulo", el, { parallel: placementsOf([session]), parallelTexts: textsOf() });
  assert.equal([...el.children].map(child => child.className.split(" ")[0]).join(), "slot,slot,parallel-span,slot");
  const group = el.querySelector(".parallel-span");
  assert.equal(group.querySelectorAll(".parallel-span-slots .slot").length, 2);
  assert.equal([...el.querySelectorAll(".slot")].map(slotEl => slotEl.dataset.index).join(), "0,1,2,3,4", "mesma ordem e mesmo índice das sessões");
  const card = group.querySelector(".parallel-card");
  assert.match(card.textContent, /Mão na massa.*Lab de IA.*Em paralelo às palestras.*Coding Jam.*10:00–12:00.*Laboratório com computadores.*Quem faz o lab/s);
  assert.match(card.getAttribute("style"), /--band-color:var\(--ia\)/, "a cor é a da trilha de IA/Vibe Coding");
  assert.equal(card.querySelector("a.parallel-cta").getAttribute("href"), "creditos.html");
  assert.ok(card.querySelector(".parallel-host-logo img").getAttribute("src").endsWith("liga-de-ti-puc.webp"));
  assert.deepEqual([...card.querySelectorAll(".parallel-host-links a")].map(a => a.getAttribute("href")), ["https://linktr.ee/ligadetipuccampinas", "https://www.instagram.com/ligadetipucc"]);
});

test("sem sessões em paralelo (padrão) a grade fica como era; faixa vazia põe só o card antes da sessão seguinte", () => {
  const plain = mount();
  site.get("renderAgenda")(SCHEDULE_STUB, [], "America/Sao_Paulo", plain);
  assert.equal(plain.querySelectorAll(".parallel-span").length, 0);
  assert.equal(plain.querySelectorAll(".slot").length, SCHEDULE_STUB.length);
  const gap = mount();
  site.get("renderAgenda")(SCHEDULE_STUB, [], "America/Sao_Paulo", gap, { parallel: placementsOf([{ ...session, rounds: [{ start: "12:00", end: "13:00" }] }]), parallelTexts: textsOf() });
  assert.equal(gap.querySelectorAll(".slot").length, SCHEDULE_STUB.length);
  assert.equal(gap.querySelector(".parallel-span-slots").children.length, 0);
  assert.equal(gap.querySelector(".parallel-span").nextElementSibling.dataset.index, "4");
});

test("só DEV: sessão paralela sem `public` some fora do modo DEV", () => {
  const repo = site.get("parallelSessionsRepository");
  assert.equal(repo.visible({ devMode: false }).length, 0);
  assert.equal(repo.visible({ devMode: true }).length, 1);
  assert.equal(repo.visible().length, 0);
});

// ---- passo a passo legível: tela ampliável, selo de destaque, bloco de quem faz o lab ----
test("cada passo tem a tela como botão que amplia; os passos principais levam selo", () => {
  const el = mount();
  site.get("renderGcpCredits")(config, el, { session, now: at("2026-11-28T10:00:00-03:00") });
  const screens = [...el.querySelectorAll(".credit-step-screen[data-zoom-src]")];
  assert.equal(screens.length, config.steps.length);
  assert.equal(screens.map(button => button.dataset.zoomSrc).join(), config.steps.map(step => step.image).join());
  assert.match(el.querySelector(".credit-step-zoom").textContent, /Toque para ampliar/);
  const key = [...el.querySelectorAll(".credit-step--key")];
  assert.equal(key.length, config.steps.filter(step => step.badge).length);
  assert.ok(key.every(item => item.querySelector(".credit-step-badge")));
});

test("tocar na tela de um passo abre a imagem grande no modal; fechar esconde", () => {
  const el = mount();
  site.get("renderGcpCredits")(config, el, { session, now: at("2026-11-28T10:00:00-03:00") });
  site.get("initImageZoom")({ rootEl: el, label: "Tela" });
  el.querySelectorAll(".credit-step-screen")[1].click();
  const modal = site.document.getElementById("imageZoomModal");
  assert.equal(modal.hidden, false);
  assert.ok(modal.querySelector(".image-zoom-img").getAttribute("src").endsWith("02-claim.webp"));
  modal.querySelector(".modal-close").click();
  assert.equal(modal.hidden, true);
});

test("o topo mostra a Liga de TI como quem faz o lab quando a página recebe a marca; sem ela, só a sessão", () => {
  const host = site.get("resolveParallelHost")(session, findHost);
  const withHost = mount();
  site.get("renderGcpCredits")(config, withHost, { session, host, parallelTexts: textsOf(), now: at("2026-11-28T10:00:00-03:00") });
  assert.ok(withHost.querySelector(".credit-hero .parallel-host-logo img").getAttribute("src").endsWith("liga-de-ti-puc.webp"));
  assert.match(withHost.querySelector(".credit-hero").textContent, /Lab de IA.*Coding Jam/s);
  const without = mount();
  site.get("renderGcpCredits")(config, without, { session, now: at("2026-11-28T10:00:00-03:00") });
  assert.equal(without.querySelectorAll(".parallel-host").length, 0);
});

test("link aberto mostra o selo 'liberado agora'; antes e depois da janela, não", () => {
  const open = mount();
  site.get("renderGcpCredits")(config, open, { session, now: at("2026-11-28T10:00:00-03:00") });
  assert.match(open.querySelector(".credit-live").textContent, /Link liberado agora/);
  const before = mount();
  site.get("renderGcpCredits")(config, before, { session, now: at("2026-11-20T10:00:00-03:00") });
  assert.equal(before.querySelectorAll(".credit-live").length, 0);
});
