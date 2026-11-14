/**
 * Testes da ordem dos palestrantes: a página Palestrantes em ordem alfabética (sortSpeakersByName, features/speakers.js) e os Destaques da home com UM de cada trilha
 * (baralho, features/featured-deck.js e featured-speakers.js: todos aparecem, ninguém repete antes de todos), com o anel e o rótulo na cor da trilha.
 *   node --test DevFestIA/tools/dom/speaker-order.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({
  globals: { TextEncoder: require("node:util").TextEncoder },
  scripts: [...SITE_BASE, "data/schedule-builder.js", "data/talk-formats.js", "data/favorites.js", "components/escape-html.js", "components/avatar.js", "components/speaker-link.js", "components/favorite-button.js", "components/person-card.js", "components/talk-highlight.js",
    "components/talk-meta.js", "components/track-card.js", "features/agenda.js", "features/speakers.js", "features/featured-deck.js", "features/featured-speakers.js", "features/speaker-photo-zoom.js"],
});
test.after(() => site.window.close());
const g = name => site.get(name);

const tracks = ["ia", "web", "mobile", "carreira", "cloud"].map(id => ({ id, label: id.toUpperCase(), shortLabel: id, color: `var(--${id})` }));
const person = (name, trackIndex) => ({ id: name, name, title: "Cargo", photo: "", track: tracks[trackIndex], talks: [] });
const pool = [person("Zélia", 0), person("Ana", 0), person("álvaro", 1), person("Bruno", 2), person("Carla", 3), person("Dora", 4), person("Eva", 4)];

test("Palestrantes em ordem alfabética: sem diferenciar acento nem maiúscula, sem mexer na lista original", () => {
  const sorted = g("sortSpeakersByName")(pool).map(speaker => speaker.name);
  assert.deepEqual([...sorted], ["álvaro", "Ana", "Bruno", "Carla", "Dora", "Eva", "Zélia"]);
  assert.equal(pool[0].name, "Zélia", "a lista de entrada continua como estava");
});

const names = people => people.map(speaker => speaker.name);
const manyPeople = (count, trackCount = 5) => Array.from({ length: count }, (_, index) => person(`P${index}`, index % trackCount));
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

test("Destaques (baralho): em uma volta TODOS aparecem exatamente uma vez, sem repetir antes de todos", () => {
  for (const total of [45, 44, 7, 5, 4]) {
    const everyone = manyPeople(total);
    const deck = g("createFeaturedDeck")(everyone, { slots: 4, random: seeded(total) });
    const seen = [];
    const frames = Math.ceil(total / 4);
    for (let frame = 0; frame < frames; frame++) seen.push(...names(deck.next()));
    const firstLap = seen.slice(0, total);
    assert.equal(new Set(firstLap).size, total, `${total} pessoas: alguém repetiu antes de todos aparecerem`);
    assert.equal(new Set(names(everyone)).size, new Set(firstLap).size);
  }
});

test("Destaques (baralho): ninguém repete na mesma tela nem na tela seguinte, em várias voltas", () => {
  const deck = g("createFeaturedDeck")(manyPeople(45), { slots: 3, random: seeded(7) });
  let previous = [];
  for (let frame = 0; frame < 120; frame++) {
    const current = names(deck.next());
    assert.equal(new Set(current).size, current.length, `repetido na tela ${frame}: ${current}`);
    assert.equal(current.some(name => previous.includes(name)), false, `repetiu na troca ${frame}`);
    previous = current;
  }
});

test("Destaques (baralho): cada tela mistura trilhas quando há trilhas de sobra, e o card fixo entra em toda tela", () => {
  const pinned = { name: "Coding Jam", pinned: true };
  const deck = g("createFeaturedDeck")(manyPeople(45), { slots: 3, pinned: [pinned], random: seeded(3) });
  for (let frame = 0; frame < 30; frame++) {
    const current = deck.next();
    assert.equal(current[0], pinned, "o fixo vem em toda tela");
    const tracksInFrame = current.slice(1).map(speaker => speaker.track.id);
    assert.equal(new Set(tracksInFrame).size, 3, `trilhas repetidas na tela ${frame}: ${tracksInFrame}`);
  }
});

test("Destaques (baralho): ninguém é fixo; o da plenária entra como todo mundo, com o rótulo Plenária no card", () => {
  const keynote = { ...person("Rodrigo", 0), keynote: true };
  const deck = g("createFeaturedDeck")([...manyPeople(44), keynote], { slots: 3, random: seeded(11) });
  const frames = Array.from({ length: 15 }, () => names(deck.next()));
  const appearances = frames.flat().filter(name => name === "Rodrigo").length;
  assert.equal(appearances, 1, "uma vez por volta, não em todas as telas");
  assert.match(g("featuredSpeakerCardMarkup")(keynote), /Plenária/, "o rótulo do card é Plenária, não a trilha");
});

test("Destaques (baralho): pool pequeno devolve todos; vazio devolve só os fixos; o embaralhamento é uniforme", () => {
  assert.equal(g("createFeaturedDeck")([person("Só", 0)], { slots: 4 }).next().length, 1);
  assert.equal(g("createFeaturedDeck")([], { slots: 4, pinned: [{ name: "X" }] }).next().length, 1);
  const counts = new Map();
  const random = seeded(99);
  for (let run = 0; run < 6000; run++) counts.set(g("shuffled")(["a", "b", "c"], random).join(""), (counts.get(g("shuffled")(["a", "b", "c"], random).join("")) ?? 0) + 1);
  assert.equal(counts.size, 6, "as 6 ordens possíveis aparecem");
});

test("Destaques: a seção troca de tela sozinha, mostra 4 cards e ninguém repete na tela (initFeaturedSpeakers)", () => {
  const sectionEl = site.document.createElement("section");
  const gridEl = site.document.createElement("div");
  const everyone = manyPeople(20);
  const id = g("initFeaturedSpeakers")(everyone, sectionEl, gridEl, { count: 4, intervalMs: 1000000, random: seeded(5) });
  assert.equal(sectionEl.hidden, false);
  assert.equal(gridEl.querySelectorAll(".featured-speaker").length, 4);
  const shown = [...gridEl.querySelectorAll(".featured-name")].map(el => el.textContent);
  assert.equal(new Set(shown).size, 4);
  site.window.clearInterval(id);
  const hidden = site.document.createElement("section");
  assert.equal(g("initFeaturedSpeakers")(everyone, hidden, gridEl, { reveal: false }), null);
  assert.equal(hidden.hidden, true);
});


test("cartão do destaque: anel e rótulo na cor da trilha, nome e cargo; sem trilha não quebra", () => {
  const html = g("featuredSpeakerCardMarkup")({ ...person("Ana Souza", 2), id: "ana" });
  const el = site.document.createElement("div");
  el.innerHTML = html;
  assert.match(el.firstElementChild.getAttribute("style"), /--track-color:var\(--mobile\)/);
  assert.equal(textOf(el.querySelector(".featured-track")), "mobile");
  assert.equal(textOf(el.querySelector(".featured-name")), "Ana Souza");
  const bare = site.document.createElement("div");
  bare.innerHTML = g("featuredSpeakerCardMarkup")({ name: "Sem Trilha", title: "", photo: "" });
  assert.equal(bare.querySelector(".featured-track"), null);
});

test("cabeçalho dos Google Developer Experts: aparece só com line-up revelado e alguém com selo; o cartão de quem tem selo vem destacado, com o selo na foto e sem repetir 'GDE' no cargo", () => {
  const section = site.document.createElement("section");
  const withBadge = [{ ...person("Zé", 0), badge: "GDE" }, person("Ana", 1)];
  g("toggleBadgedHeader")(withBadge, section, { reveal: true });
  assert.equal(section.hidden, false);
  g("toggleBadgedHeader")(withBadge, section, { reveal: false });
  assert.equal(section.hidden, true);
  g("toggleBadgedHeader")([person("Ana", 1)], section, { reveal: true });
  assert.equal(section.hidden, true, "sem ninguém com selo o cabeçalho não aparece");

  const card = site.document.createElement("div");
  card.innerHTML = g("speakerGalleryCardMarkup")({ ...person("Zé", 0), badge: "GDE" });
  assert.ok(card.querySelector(".speaker-card--badged"));
  assert.equal(textOf(card.querySelector(".speaker-badge")), "GDE");
  assert.equal(textOf(card.querySelector(".speaker-card-meta")), "Cargo", "o selo já está na foto");
  card.innerHTML = g("speakerGalleryCardMarkup")(person("Ana", 1));
  assert.equal(card.querySelector(".speaker-card--badged"), null);
  assert.equal(card.querySelector(".speaker-badge"), null);
});

test("palestra de quem tem selo: o card ganha a faixa do selo por extenso; sem selo não; com destaque de sessão, as duas faixas", () => {
  const el = site.document.createElement("div");
  const track = tracks[2];
  const gde = { ...person("Ana", 2), badge: "GDE", badgeLabel: "Google Developer Expert" };
  el.innerHTML = g("trackCardMarkup")(track, { title: "T", format: "palestra", speakers: [gde] }, {});
  assert.ok(el.querySelector(".talk--badged"));
  assert.equal(textOf(el.querySelector(".talk-ribbon--badge")), "Google Developer Expert");
  el.innerHTML = g("trackCardMarkup")(track, { title: "T", format: "palestra", speakers: [person("Beto", 2)] }, {});
  assert.equal(el.querySelector(".talk--badged"), null);
  el.innerHTML = g("trackCardMarkup")(track, { title: "T", speakers: [gde], highlight: "maonamassa" }, {});
  assert.ok(el.querySelector(".talk-ribbon--badge"), "o selo fica no topo");
  assert.equal(textOf(el.querySelector(".talk-ribbon--badge + .talk-ribbon")), "Mão na massa", "a faixa do destaque vem logo abaixo");
  assert.ok(textOf(el.querySelector(".talk-highlight-note")).includes("notebook"));
  assert.equal(el.querySelector(".talk-podium"), null, "sem concurso, sem pódio");
  const detail = site.document.createElement("div");
  detail.innerHTML = g("talkDetailMarkup")(track, { title: "T", format: "workshop", speakers: [gde], description: "x" }, {});
  assert.equal(textOf(detail.querySelector(".detail-badge")), "Google Developer Expert");
});

test("Destaques: o card mostra o título da palestra e a foto fica pronta pro zoom; sem foto, nada de zoom", () => {
  const withPhoto = { ...person("Ana", 1), photo: "assets/x.webp", talks: [{ title: "Agentes de IA", track: tracks[1], slotIndex: 0, startLabel: "10:00" }] };
  const el = site.document.createElement("div");
  el.innerHTML = g("featuredSpeakerCardMarkup")(withPhoto);
  assert.equal(textOf(el.querySelector(".featured-talk")), "“Agentes de IA”");
  const img = el.querySelector("img[data-zoom-photo]");
  assert.equal(img.dataset.zoomName, "Ana");
  assert.equal(img.dataset.zoomTalks, "Agentes de IA");
  el.innerHTML = g("featuredSpeakerCardMarkup")(person("Beto", 2));
  assert.equal(el.querySelector("[data-zoom-photo]"), null);
  assert.equal(el.querySelector(".featured-talk"), null);
});

test("Zoom da foto: o clique na foto abre o modal com nome, cargo e palestras, sem seguir o link do card; logo em SVG não amplia", () => {
  const opened = [];
  const host = site.document.createElement("div");
  host.innerHTML = `<a href="#perfil" class="card">${g("avatarMarkup")("Ana", "assets/x.webp", "foto", { meta: "GDE · Cargo", talks: ["Palestra A", "Palestra B"], color: "var(--ia)" })}</a>${g("avatarMarkup")("GDG", "assets/gdg.svg", "foto", { meta: "" })}`;
  site.document.body.appendChild(host);
  g("initSpeakerPhotoZoom")({ rootEl: site.document, makeModal: () => ({ openHTML: html => opened.push(html) }) });
  assert.equal(host.querySelectorAll("img[data-zoom-photo]").length, 1, "o SVG não é ampliável");
  let followed = false;
  host.querySelector("a").addEventListener("click", () => { followed = true; });
  host.querySelector("img").dispatchEvent(new site.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  assert.equal(opened.length, 1);
  assert.ok(opened[0].includes("Ana") && opened[0].includes("GDE · Cargo") && opened[0].includes("Palestra B"));
  assert.equal(followed, false, "o clique não chega no card");
});


test("Galeria: a fala da plenária (banner com `keynote`) conta como fala do palestrante, na trilha da sala, e marca a pessoa como `keynote`", () => {
  const speaker = { id: "k1", name: "Fulano", title: "DevRel", photo: "" };
  const talk = { title: "Fala", format: "palestra", highlight: "plenaria", tags: [], speakers: [speaker], description: "" };
  const schedule = [{ start: new Date("2026-11-28T16:30:00Z"), end: new Date("2026-11-28T17:10:00Z"), banner: "Plenária", keynote: { trackId: "ia", speakers: [speaker], talk } }];
  const [person] = g("extractSpeakers")(schedule, tracks, "America/Sao_Paulo");
  assert.equal(person.name, "Fulano");
  assert.equal(person.keynote, true);
  assert.equal(person.track.id, "ia");
  assert.equal(person.talks[0].title, "Fala");
  assert.deepEqual(Object.keys(g("slotTalks")({ banner: "Almoço" })), [], "faixa comum não tem fala");
});
