/**
 * Testes de TELA do quadro da sala (docs/js/features/checkin-display.js) quanto às perguntas ao vivo: palestra comum monta a
 * coluna de perguntas; sessão que as desliga (Coding Jam) não monta, mas o QR de check-in (que libera o voto) continua.
 *   node --test DevFestIA/tools/dom/checkin-display.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({
  globals: { QRCode: function QRCode() {} }, // o desenho do QR não importa aqui
  scripts: [...SITE_BASE, "data/favorites.js", "features/agenda.js", "features/talk-index.js", "components/track-card.js", "components/room-panel.js", "components/room-board.js",
    "features/room-board.js", "features/checkin-display.js"],
});
const { window, document } = site;
test.after(() => window.close());
const initCheckinDisplay = site.get("initCheckinDisplay");

const track = { id: "mobile", label: "Mobile / Agile", shortLabel: "Mobile/Agile", color: "#3186FF", room: "Sala Lagoa do Taquaral" };
const at = iso => new Date(iso);
const schedule = (talk) => [
  { banner: "Credenciamento", start: at("2026-11-28T11:00:00Z"), end: at("2026-11-28T11:30:00Z") },
  { talks: { mobile: talk }, start: at("2026-11-28T17:15:00Z"), end: at("2026-11-28T17:55:00Z") },
  { banner: "Encerramento", start: at("2026-11-28T20:15:00Z"), end: at("2026-11-28T21:00:00Z") },
];

/** Monta o quadro às 14:20 (horário de Brasília) e devolve o que a tela mostra e o que pediu às perguntas. */
function setup(talk) {
  document.body.innerHTML = `<div id="cdScreen"><div class="cd-body"></div></div>`;
  const follows = [];
  initCheckinDisplay(document.getElementById("cdScreen"), {
    schedule: schedule(talk), track, timezone: "America/Sao_Paulo", siteUrl: "https://site/", now: () => at("2026-11-28T17:20:00Z"),
    boardQuestions: { follow: arg => follows.push(arg) },
  });
  return { follows, body: document.querySelector(".cd-body") };
}

test("palestra comum: monta a coluna de perguntas e as acompanha", () => {
  const { follows, body } = setup({ title: "Compose avançado", speakers: [{ name: "Ana" }] });
  assert.ok(body.querySelector("#cdQuestions"));
  assert.equal(follows.at(-1).phase, "open");
  assert.match(follows.at(-1).key, /\|mobile$/);
});

test("Coding Jam (perguntas desligadas): sem coluna de perguntas, mas com o QR de check-in da sala", () => {
  const { follows, body } = setup({ title: "GDG Campinas Coding Jam", speakers: [], highlight: "codejam" });
  assert.equal(body.querySelector("#cdQuestions"), null);
  assert.equal(follows.at(-1), null, "não acompanha perguntas dessa sessão");
  assert.ok(body.querySelector(".cd-panel--checkin"), "o check-in continua, é ele que libera o voto");
  assert.match(textOf(body), /GDG Campinas Coding Jam/);
  assert.ok(!textOf(body).includes("PERGUNTAS"));
});
