/**
 * Testes do card da Liga de TI da PUC na página Palestrantes (parallelSpeakers em features/parallel-sessions.js + speakerGalleryCardMarkup em features/speakers.js):
 * a sessão em paralelo (Coding Jam) não está na grade, mas a Liga aparece como quem fala, com logo, cargo, ícones e a sessão como "palestra" que leva à página dela.
 *   node --test --test-force-exit DevFestIA/tools/dom/speakers-parallel.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({
  globals: { TextEncoder: require("node:util").TextEncoder },
  scripts: [...SITE_BASE, "data/sponsors.js", "data/parallel-sessions.js", "components/escape-html.js", "components/avatar.js", "components/speaker-link.js", "components/person-card.js", "components/talk-meta.js",
    "components/track-card.js", "features/parallel-sessions.js", "features/speakers.js", "features/track-filter.js"],
});
test.after(() => site.window.close());
const g = name => site.get(name);

const tracks = ["ia", "webdata", "mobile"].map(id => ({ id, label: id.toUpperCase(), shortLabel: id, color: `var(--${id})` }));
const findHost = name => g("sponsorsRepository").findByName(name);
const sessions = g("parallelSessionsRepository").getAll();
const speakersOf = list => g("parallelSpeakers")({ sessions: list, tracks, findHost });

test("a Liga vira quem fala: logo como foto, cargo, Linktree e Instagram, na trilha de IA", () => {
  const [liga, ...rest] = speakersOf(sessions);
  assert.equal(rest.length, 0);
  assert.equal(liga.name, "Liga de TI da PUC");
  assert.equal(liga.title, "Liga Acadêmica de TI da PUC-Campinas");
  assert.match(liga.photo, /liga-de-ti-puc/);
  assert.deepEqual([...liga.social.map(item => item.name)], ["linktree", "instagram"]);
  assert.equal(liga.track.id, "ia");
  assert.equal(liga.talks.length, 1);
  assert.equal(liga.talks[0].title, "Coding Jam");
});

test("o card traz nome, cargo, os dois ícones e a sessão como link (sem abrir o modal da grade)", () => {
  const box = site.document.createElement("div");
  box.innerHTML = g("speakerGalleryCardMarkup")(speakersOf(sessions)[0]);
  const card = box.querySelector(".speaker-card");
  assert.equal(card.dataset.tracks, "ia");
  assert.match(card.querySelector(".speaker-card-name").textContent, /Liga de TI da PUC/);
  assert.match(card.querySelector(".speaker-card-meta").textContent, /Liga Acadêmica de TI da PUC-Campinas/);
  assert.equal(card.querySelectorAll(".social-icon").length, 2);
  const talk = card.querySelector(".speaker-talk");
  assert.equal(talk.tagName, "A");
  assert.equal(talk.getAttribute("href"), "creditos.html");
  assert.equal(talk.dataset.track, "ia", "o filtro de trilha esconde e mostra a sessão junto com o card");
  assert.ok(!talk.hasAttribute("data-slot-index"), "sem slot na grade, o clique não abre o modal");
  assert.match(talk.textContent, /Coding Jam/);
});

test("quem tem só LinkedIn continua igual: um ícone, sem a lista de ícones", () => {
  const box = site.document.createElement("div");
  const track = tracks[0];
  box.innerHTML = g("speakerGalleryCardMarkup")({ id: "x", name: "Ana Souza", title: "Dev", company: "", photo: "", linkedin: "https://linkedin.com/in/x", track, talks: [{ track, slotIndex: 0, title: "T", startLabel: "09:00" }] });
  assert.equal(box.querySelectorAll(".social-icon").length, 1);
  assert.equal(box.querySelector(".speaker-talk").tagName, "DIV");
});

test("sessão escondida (public: false) não entra; sessão sem trilha conhecida ou sem marca também não", () => {
  const visible = g("parallelSessionsRepository").visible({ devMode: false });
  assert.equal(speakersOf(visible).length, visible.length);
  assert.equal(speakersOf([{ ...sessions[0], trackId: "nao-existe" }]).length, 0);
  assert.equal(speakersOf([{ ...sessions[0], host: { ...sessions[0].host, sponsor: "Ninguém" } }]).length, 0);
});

test("o filtro de trilha esconde o card da Liga fora da IA e conta ela na aba de IA", () => {
  const speakers = speakersOf(sessions);
  const counts = g("speakerCountsByTrack")(speakers, tracks);
  assert.equal(counts.ia, 1);
  assert.equal(counts.mobile, 0);
});
