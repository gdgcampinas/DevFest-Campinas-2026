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
const site = loadSite({ scripts: [...SITE_BASE, "data/gcp-credits.js", "components/info-card.js", "components/credit-steps.js", "components/credit-link-card.js", "components/talk-highlight.js", "features/gcp-credit-window.js", "features/gcp-credits.js", "features/gcp-credit-poster.js"] });
test.after(() => site.window.close());
const config = site.get("gcpCreditsRepository").getAll();
const creditWindowState = site.get("creditWindowState");
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
  site.get("renderGcpCredits")(config, el, { now: at("2026-11-20T12:00:00-03:00") });
  assert.match(el.querySelector(".credit-link-msg").textContent, /28\/11 às 07:00/);
  assert.equal(el.querySelectorAll("a[data-credit]").length, 0);
});

test("dentro da janela: link principal e QR visíveis, reserva só dentro de <details>", () => {
  const el = mount();
  site.get("renderGcpCredits")(config, el, { now: at("2026-11-28T10:00:00-03:00") });
  const main = el.querySelector(".credit-link-open a[data-credit]");
  assert.equal(main.getAttribute("href"), "https://g.dev/credits/gdg-campinas-4");
  assert.ok(el.querySelector(".credit-qr").getAttribute("src").endsWith("qr-gdg-campinas-4.webp"));
  const backup = el.querySelector("details.credit-backup a[data-credit]");
  assert.equal(backup.getAttribute("href"), "https://g.dev/credits/gdg-campinas-4-bkp");
  assert.match(el.querySelector(".credit-link-until").textContent, /28\/11 às 19:00/);
});

test("à noite vale o par -5 e depois de tudo aparece 'encerrado'", () => {
  const night = mount();
  site.get("renderGcpCredits")(config, night, { now: at("2026-11-28T22:00:00-03:00") });
  assert.equal(night.querySelector(".credit-link-open a[data-credit]").getAttribute("href"), "https://g.dev/credits/gdg-campinas-5");
  const closed = mount();
  site.get("renderGcpCredits")(config, closed, { now: at("2026-11-30T12:00:00-03:00") });
  assert.equal(closed.querySelectorAll("a[data-credit]").length, 0);
  assert.match(closed.querySelector(".credit-link-msg").textContent, /encerraram/);
});

test("a página mostra a sessão, os requisitos, um passo por tela e os materiais oficiais", () => {
  const el = mount();
  site.get("renderGcpCredits")(config, el, { now: at("2026-11-28T10:00:00-03:00") });
  assert.match(el.querySelector(".credit-session").textContent, /Coding Jam.*Laboratório.*1ª rodada, das 10:00 às 12:00/s);
  assert.equal(el.querySelectorAll("#creditRequirements .faq-item").length, config.requirements.length);
  assert.equal(el.querySelectorAll(".credit-step").length, config.steps.length);
  assert.equal([...el.querySelectorAll(".credit-step-num")].map(n => n.textContent).join(), config.steps.map((_, i) => i + 1).join());
  assert.ok([...el.querySelectorAll(".credit-official a")].some(a => a.href === "https://goo.gle/gcpcredits-en"));
});

test("mais de uma rodada vira mais de uma linha", () => {
  const el = mount();
  const two = { ...config, session: { ...config.session, rounds: [{ start: "10:00", end: "12:00" }, { start: "14:00", end: "16:00" }] } };
  site.get("renderGcpCredits")(two, el, { now: at("2026-11-28T10:00:00-03:00") });
  assert.match(el.querySelector(".credit-session").textContent, /2ª rodada, das 14:00 às 16:00/);
});

test("cartaz: QR da janela escolhida, passos compactos (sem texto) e o endereço do site", () => {
  const el = mount();
  site.get("renderGcpPoster")(config, el, { windowId: "night", siteUrl: "exemplo.com/creditos.html" });
  assert.ok(el.querySelector(".credit-poster-qr img").getAttribute("src").endsWith("qr-gdg-campinas-5.webp"));
  assert.equal(el.querySelectorAll(".credit-steps--compact .credit-step").length, config.steps.length);
  assert.equal(el.querySelectorAll(".credit-steps--compact p").length, 0);
  assert.match(el.querySelector(".credit-poster-foot").textContent, /exemplo\.com\/creditos\.html/);
  const fallback = mount();
  site.get("renderGcpPoster")(config, fallback, {});
  assert.ok(fallback.querySelector(".credit-poster-qr img").getAttribute("src").endsWith("qr-gdg-campinas-4.webp"), "sem janela escolhida, a primeira");
});

test("só DEV: o card de 'Antes de vir' e o botão do Coding Jam somem enquanto `public` é falso", () => {
  const card = site.get("gcpCreditsInfoCard");
  assert.equal(config.public, false);
  assert.equal(card(config, { devMode: false }), null);
  assert.equal(card(config, { devMode: true }).href, "creditos.html");
  assert.equal(card({ ...config, public: true }, { devMode: false }).href, "creditos.html");
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
