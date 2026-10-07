/**
 * Testes de TELA do destaque de sessão (Coding Jam) na grade: o card (chip duplo, frase, pódio, aviso, quem conduz), o card comum
 * que continua igual, os estados (favorito, ao vivo, line-up escondido), o modal (etapas, regras, sem o bloco de perguntas), o
 * calendário e o índice de palestras (favoritar, `?agenda=`, .ics). Rodam os scripts de verdade do site em jsdom, sem Firebase.
 *   node --test DevFestIA/tools/dom/talk-highlight.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { TextEncoder } = require("node:util");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({
  globals: { TextEncoder }, // o .ics mede a dobra de linha em bytes
  scripts: [...SITE_BASE, "data/talk-formats.js", "data/favorites.js", "components/avatar.js", "components/speaker-link.js", "components/favorite-button.js", "components/person-card.js",
    "components/talk-highlight.js", "components/talk-meta.js", "components/track-card.js", "features/agenda.js", "features/calendar.js", "features/talk-index.js"],
});
const { window, document } = site;
test.after(() => window.close());

const trackCardMarkup = site.get("trackCardMarkup");
const talkDetailMarkup = site.get("talkDetailMarkup");
const talkWhoList = site.get("talkWhoList");
const highlights = site.get("talkHighlightsRepository");

const track = { id: "mobile", label: "Mobile / Agile", shortLabel: "Mobile/Agile", color: "#3186FF", room: "Sala Lagoa do Taquaral" };
const jam = { title: "GDG Campinas Coding Jam", format: "workshop", tags: ["jam", "projetos"], speakers: [], description: "Monte, apresente e vote.", highlight: "codejam" };
const normal = { title: "Testes em mobile sem sofrimento", format: "palestra", tags: ["testes"], speakers: [{ name: "Mia Robinson", linkedin: "https://linkedin.com/in/mia", title: "QA", company: "Acme" }], description: "Pirâmide de testes." };

/** O primeiro elemento do HTML devolvido por um template. */
const render = html => {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
};
const cardOf = (data, options = {}) => render(trackCardMarkup(track, data, { startLabel: "14:15", duration: "40 min", talkKey: "k1", ...options }));
/** Objetos criados dentro do jsdom não passam em deepEqual contra os do Node: compara por JSON. */
const plain = value => JSON.parse(JSON.stringify(value));
const texts = (root, selector) => [...root.querySelectorAll(selector)].map(textOf);

test("card do Coding Jam: chip Workshop mais chip Coding Jam, frase, pódio 1º 2º 3º e aviso", () => {
  const root = cardOf(jam);
  const card = root.querySelector(".talk");
  assert.ok(card.classList.contains("talk--highlight"));
  assert.match(card.getAttribute("style"), /--highlight-color:var\(--google-yellow\)/);
  assert.deepEqual(texts(root, ".talk-format"), ["Workshop", "Coding Jam"]);
  assert.equal(textOf(root.querySelector(".talk-highlight-tagline")), "Monte seu projeto, apresente e dispute o pódio");
  assert.deepEqual(texts(root, ".talk-podium-slot"), ["1º lugar", "2º lugar", "3º lugar"]);
  assert.equal(textOf(root.querySelector(".talk-highlight-note")), "Traga seu notebook");
  assert.ok(root.querySelector(".talk-highlight-note svg"), "o aviso tem o ícone do dado");
  assert.equal(textOf(root.querySelector(".title")), "GDG Campinas Coding Jam");
});

test("destaque forte: faixa Mão na massa, marca d'água do troféu e chip cheio, só decoração (aria-hidden)", () => {
  const root = cardOf(jam);
  assert.equal(textOf(root.querySelector(".talk-ribbon")), "Mão na massa");
  const mark = root.querySelector(".talk-highlight-mark");
  assert.equal(mark.getAttribute("aria-hidden"), "true");
  assert.ok(mark.querySelector("svg.talk-highlight-mark-icon"), "o ícone do dado vira a marca d'água");
  assert.equal(cardOf({ ...jam, highlight: undefined }).querySelector(".talk-ribbon"), null, "palestra comum não tem faixa");
});

test("o Coding Jam vale em qualquer trilha e sala: a cor e a sala são sempre as da trilha onde ele cair", () => {
  const tracks = [
    { id: "ia", label: "IA", shortLabel: "IA", color: "#3186FF", room: "Sala Observatório" },
    { id: "webdata", label: "Front/Back/Data", shortLabel: "Front/Back/Data", color: "#FFEC00", room: "Sala Estação" },
    { id: "mobile", label: "Mobile / Agile", shortLabel: "Mobile/Agile", color: "#34A853", room: "Sala Lagoa do Taquaral" },
    { id: "mentoring", label: "Carreira", shortLabel: "Carreira", color: "#FC413D", room: "Sala Mercadão Central" },
  ];
  tracks.forEach(other => {
    const root = render(trackCardMarkup(other, jam, { talkKey: "k1" }));
    const card = root.querySelector(".talk");
    assert.ok(card.classList.contains("talk--highlight"), `${other.id}: destaque`);
    assert.equal(card.dataset.track, other.id);
    assert.match(card.getAttribute("style"), new RegExp(`--track-color:${other.color}`));
    assert.equal(textOf(root.querySelector(".room-tag")), other.room);
    assert.ok(root.querySelector(".talk-ribbon"), `${other.id}: faixa (não depende só da cor da trilha)`);
    const modal = render(talkDetailMarkup(other, jam, { reveal: true, talkKey: "k1", room: other.room }));
    assert.equal(modal.querySelectorAll(".detail-steps li").length, 4, `${other.id}: modal`);
  });
});

test("sem palestrante: o card mostra quem conduz (GDG Campinas) em vez de 'undefined'", () => {
  const html = trackCardMarkup(track, jam, { talkKey: "k1" });
  assert.ok(!html.includes("undefined"));
  const root = render(html);
  assert.equal(textOf(root.querySelector(".talk-name")), "GDG Campinas");
  assert.match(root.querySelector(".talk-avatar").getAttribute("src"), /assets\/brand\/gdg-icon\.svg$/);
  assert.equal(root.querySelectorAll(".talk-links a").length, 0, "quem conduz não tem LinkedIn");
});

test("o prêmio só aparece no pódio quando está preenchido no dado", () => {
  const podium = site.run("TALK_HIGHLIGHTS[0].podium");
  podium[0].prize = "Troféu e kit";
  try {
    assert.deepEqual(texts(cardOf(jam), ".talk-podium-slot"), ["1º lugarTroféu e kit", "2º lugar", "3º lugar"]);
  } finally {
    podium[0].prize = "";
  }
  assert.deepEqual(texts(cardOf(jam), ".talk-podium-slot"), ["1º lugar", "2º lugar", "3º lugar"]);
});

test("card comum continua igual: sem classe, chip, pódio nem aviso do destaque", () => {
  const root = cardOf(normal);
  const card = root.querySelector(".talk");
  assert.ok(!card.classList.contains("talk--highlight"));
  assert.ok(!card.getAttribute("style").includes("--highlight-color"));
  assert.deepEqual(texts(root, ".talk-format"), ["Palestra"]);
  assert.equal(root.querySelectorAll(".talk-highlight, .talk-podium").length, 0);
  assert.equal(textOf(root.querySelector(".talk-name")), "Mia Robinson");
  assert.equal(root.querySelectorAll(".talk-links a").length, 1, "o LinkedIn do palestrante continua");
});

test("com o line-up escondido (reveal falso) o Coding Jam volta ao card genérico, sem vazar o destaque", () => {
  const html = trackCardMarkup(track, jam, { reveal: false, talkKey: "k1" });
  assert.ok(!html.includes("talk--highlight") && !html.includes("Coding Jam") && !html.includes("podium"));
  assert.match(textOf(render(html)), /Em breve/);
});

test("convive com favorito: estrela, estado marcado e destaque no mesmo card", () => {
  const card = cardOf(jam, { favorite: true }).querySelector(".talk");
  assert.ok(card.classList.contains("is-fav") && card.classList.contains("talk--highlight"));
  const star = card.querySelector(".fav-btn");
  assert.equal(star.dataset.talkKey, "k1");
  assert.equal(star.getAttribute("aria-pressed"), "true");
});

test("convive com 'acontecendo agora': tag AGORA e barra de progresso no card de destaque", () => {
  const root = cardOf(jam, { live: true, progress: 0.5 });
  assert.ok(root.querySelector(".talk").classList.contains("talk--highlight"));
  assert.ok(root.querySelector(".now-tag"));
  assert.equal(root.querySelector(".talk-progress b").style.width, "50%");
});

test("o card abre o modal como os outros (data-slot-index, tabindex, role)", () => {
  const card = cardOf(jam, { slotIndex: 6 }).querySelector(".talk");
  assert.equal(card.dataset.slotIndex, "6");
  assert.equal(card.getAttribute("role"), "button");
  assert.equal(card.getAttribute("tabindex"), "0");
});

test("modal do Coding Jam: etapas, pódio e regras; avaliação sim, perguntas ao vivo não", () => {
  const root = render(talkDetailMarkup(track, jam, { reveal: true, timeRange: "14:15 às 14:55", room: track.room, talkKey: "k1" }));
  assert.equal(root.querySelectorAll(".detail-steps li").length, 4);
  assert.deepEqual(texts(root, ".detail-steps li strong"), ["Intro e setup", "Construção", "Apresentação", "Votação e pódio"]);
  assert.deepEqual(texts(root, ".detail-highlight-section h4"), ["Como funciona", "Pódio", "Regras"]);
  assert.equal(root.querySelectorAll(".detail-rules li").length, 3);
  assert.deepEqual(texts(root, ".talk-podium-slot"), ["1º lugar", "2º lugar", "3º lugar"]);
  assert.deepEqual(texts(root, ".talk-format"), ["Workshop", "Coding Jam"]);
  assert.match(root.querySelector(".detail").getAttribute("style"), /--highlight-color:var\(--google-yellow\)/);
  assert.ok(root.querySelector(".talk-feedback-slot"), "a avaliação continua");
  assert.equal(root.querySelector(".talk-questions-slot"), null, "sem bloco de perguntas ao vivo");
  assert.equal(textOf(root.querySelector(".detail-speaker")), "GDG Campinas");
  assert.ok(!root.innerHTML.includes("undefined"));
});

test("modal comum continua com avaliação e perguntas, sem seções de destaque", () => {
  const root = render(talkDetailMarkup(track, normal, { reveal: true, timeRange: "14:15", room: track.room, talkKey: "k1" }));
  assert.ok(root.querySelector(".talk-feedback-slot") && root.querySelector(".talk-questions-slot"));
  assert.equal(root.querySelectorAll(".detail-highlight").length, 0);
});

test("modal com line-up escondido não traz o destaque nem os blocos de feedback", () => {
  const root = render(talkDetailMarkup(track, jam, { reveal: false, talkKey: "k1" }));
  assert.equal(root.querySelectorAll(".detail-highlight, .talk-feedback-slot, .talk-questions-slot").length, 0);
});

test("talkWhoList: palestrantes primeiro; sem eles, quem conduz; sem nada, vazio", () => {
  const names = data => plain(talkWhoList(data).map(person => person.name));
  assert.deepEqual(names(normal), ["Mia Robinson"]);
  assert.deepEqual(names(jam), ["GDG Campinas"]);
  assert.deepEqual(names({ ...jam, speakers: [{ name: "Ana" }] }), ["Ana"]);
  assert.deepEqual(names({ title: "x", speakers: [], highlight: "inexistente" }), []);
});

test("repository: destaque por palestra e perguntas ao vivo ligadas, salvo quando o destaque desliga", () => {
  assert.equal(highlights.forTalk(jam).id, "codejam");
  assert.equal(highlights.forTalk(normal), undefined);
  assert.equal(highlights.forTalk({ highlight: "inexistente" }), undefined);
  assert.equal(highlights.allowsQuestions(jam), false);
  assert.equal(highlights.allowsQuestions(normal), true);
  assert.equal(highlights.allowsQuestions({ highlight: "inexistente" }), true);
});

test("índice e calendário: o Coding Jam favorita, compartilha por código e vai pro .ics como as outras", () => {
  const slot = { start: new Date("2026-11-28T17:15:00Z"), end: new Date("2026-11-28T17:55:00Z"), talks: { mobile: jam } };
  const index = site.get("buildTalkIndex")([slot], [track], "America/Sao_Paulo");
  const key = "2026-11-28T17:15:00.000Z|mobile";
  assert.equal(index.get(key).data.title, "GDG Campinas Coding Jam");
  assert.equal(index.getByCode("1415.mobile").key, key, "o código de compartilhamento (?agenda=) ida e volta");

  const event = { venueConfirmed: false, address: "Campinas, SP" };
  const entry = site.get("talkToCalendarEntry")(index.get(key), event, "https://site/");
  assert.equal(entry.title, "GDG Campinas Coding Jam");
  assert.deepEqual(plain([entry.start.toISOString(), entry.end.toISOString()]), ["2026-11-28T17:15:00.000Z", "2026-11-28T17:55:00.000Z"]);
  assert.match(entry.details, /Coding Jam: Monte seu projeto, apresente e dispute o pódio/);
  assert.ok(!entry.details.includes("Palestrante(s)"), "quem conduz não vira palestrante no calendário");
  const ics = site.get("buildIcs")([entry], { name: "Agenda" });
  assert.match(ics, /SUMMARY:GDG Campinas Coding Jam/);

  const common = site.get("talkToCalendarEntry")({ ...index.get(key), data: normal }, event, "https://site/");
  assert.ok(!common.details.includes("Coding Jam"), "palestra comum não ganha a linha do destaque");
  assert.match(common.details, /Palestrante\(s\): Mia Robinson/);
});
