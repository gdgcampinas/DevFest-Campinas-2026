/**
 * Testes de TELA da plenária e da sessão em paralelo (Coding Jam) nos favoritos (docs/js/components/track-card.js `bannerMarkup`, features/agenda.js `bannerFavoriteOptions`, features/favorites-filter.js): a fala da plenária é uma palestra,
 * então tem estrela e só aparece em "Minha agenda" quando salva; as faixas sem palestrante (credenciamento, almoço) continuam sempre visíveis.
 *   node --test --test-force-exit DevFestIA/tools/dom/favorites-keynote.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/persisted-set-repository.js", "data/favorites.js", "data/talk-formats.js", "components/avatar.js", "components/person-card.js", "components/talk-highlight.js", "components/talk-meta.js", "components/favorite-button.js", "components/track-card.js", "components/parallel-session-card.js", "features/parallel-sessions.js", "features/agenda.js", "features/favorites.js", "features/favorites-filter.js"] });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);

const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);
const tracks = [{ id: "ia", label: "IA", color: "blue" }];
const schedule = [
  { banner: "Almoço", start: at("12:00"), end: at("13:20") },
  { banner: "Plenária", room: "Sala Observatório", start: at("13:30"), end: at("14:10"), keynote: { title: "Fala de abertura", trackId: "ia", speakers: [{ id: "k1", name: "Fulano" }], description: "" }, talks: { ia: { title: "Fala de abertura", speakers: [{ id: "k1", name: "Fulano" }] } } },
  { start: at("14:15"), end: at("14:55"), talks: { ia: { title: "Outra palestra", speakers: [{ id: "p1", name: "Pessoa" }] } } },
];
const keynoteKey = () => g("talkKey")(schedule[1], "ia");

const session = { id: "cj", name: "Coding Jam", color: "green", kicker: "Mão na massa", place: "Prédio H-02", description: "", href: "coding-jam.html", rounds: [{ start: "14:15", end: "16:15" }] };
const placement = { session, round: session.rounds[0], roundIndex: 0, host: null, highlight: undefined, from: 2, to: 2 };
const parallelKey = () => g("parallelTalkKey")(placement);
const parallelTexts = { tag: "Em paralelo", details: "Ver detalhes" };

function mount({ saved = [], withParallel = false } = {}) {
  document.body.innerHTML = `<button id="fav"></button><p id="empty" hidden></p><div id="agenda"></div>`;
  const favorites = g("createPersistedSetRepository")({ storageKey: `k-${Math.random()}`, storage: null });
  favorites.addAll(saved);
  const agendaEl = document.getElementById("agenda");
  g("renderAgenda")(schedule, tracks, "America/Sao_Paulo", agendaEl, { favorites, ...(withParallel && { parallel: [placement], parallelTexts }) });
  g("initFavorites")(document.body, favorites);
  const toggleEl = document.getElementById("fav");
  g("renderFavoritesToggle")(toggleEl, "Minha agenda");
  g("initFavoritesFilter")({ toggleEl, scopeEl: agendaEl, emptyEl: document.getElementById("empty"), repository: favorites });
  const slotOf = index => agendaEl.querySelector(`.slot[data-index="${index}"]`);
  const hidden = index => slotOf(index).classList.contains("no-fav");
  return { favorites, toggleEl, agendaEl, slotOf, hidden, emptyEl: document.getElementById("empty") };
}

test("a plenária ganha a estrela com a chave de favorito da fala; faixa sem palestrante (almoço) não ganha", () => {
  const { slotOf } = mount();
  const star = slotOf(1).querySelector(".banner--keynote > .fav-btn");
  assert.ok(star, "a plenária tem estrela");
  assert.equal(star.dataset.talkKey, keynoteKey());
  assert.equal(slotOf(1).querySelector(".banner--keynote").dataset.talkKey, keynoteKey());
  assert.equal(slotOf(0).querySelector(".fav-btn"), null, "o almoço não tem estrela");
});

test("sem favorito da plenária ela SAI de 'Minha agenda'; salvando a estrela, ela volta; tirando, sai de novo", () => {
  const { toggleEl, slotOf, hidden, favorites } = mount();
  toggleEl.click();
  assert.equal(hidden(1), true, "plenária não salva: some");
  assert.equal(hidden(2), true, "palestra não salva: some");
  slotOf(1).querySelector(".fav-btn").click();
  assert.equal(favorites.has(keynoteKey()), true);
  assert.equal(hidden(1), false, "salvou a plenária: volta");
  assert.ok(slotOf(1).querySelector(".banner--keynote").classList.contains("is-fav"));
  slotOf(1).querySelector(".fav-btn").click();
  assert.equal(hidden(1), true, "tirou a estrela: sai");
});

test("a plenária já salva abre aparecendo; as faixas sem palestra (almoço) ficam sempre visíveis, com ou sem favoritos", () => {
  const { toggleEl, hidden, slotOf } = mount({ saved: ["x"] });
  assert.equal(slotOf(1).querySelector(".banner--keynote").classList.contains("is-fav"), false);
  toggleEl.click();
  assert.equal(hidden(0), false, "almoço: o esqueleto do dia fica");
  const saved = mount({ saved: [keynoteKey()] });
  saved.toggleEl.click();
  assert.equal(saved.hidden(1), false, "plenária salva aparece");
  assert.equal(saved.hidden(0), false);
});

test("sem repositório de favoritos (agenda sem estrela) a plenária não ganha estrela", () => {
  document.body.innerHTML = `<div id="agenda"></div>`;
  g("renderAgenda")(schedule, tracks, "America/Sao_Paulo", document.getElementById("agenda"));
  assert.equal(document.querySelector(".banner--keynote .fav-btn"), null);
  assert.equal(g("bannerFavoriteOptions")(schedule[0], { has: () => true }) && Object.keys(g("bannerFavoriteOptions")(schedule[0], { has: () => true })).length, 0, "faixa sem keynote: sem opções");
});

test("Coding Jam: o card da sessão em paralelo ganha a estrela com a chave própria e só aparece em 'Minha agenda' quando salvo", () => {
  const { agendaEl, toggleEl } = mount({ withParallel: true });
  const card = agendaEl.querySelector(".parallel-card");
  const star = card.querySelector(".fav-btn");
  assert.ok(star, "o card tem estrela");
  assert.equal(star.dataset.talkKey, "parallel|cj|0");
  assert.equal(card.dataset.talkKey, "parallel|cj|0");
  assert.notEqual(parallelKey(), keynoteKey(), "a chave não colide com a das palestras");
  toggleEl.click();
  assert.equal(card.classList.contains("is-fav"), false, "não salvo: o CSS esconde o card em 'Minha agenda'");
  star.click();
  assert.equal(card.classList.contains("is-fav"), true);
  star.click();
  assert.equal(card.classList.contains("is-fav"), false);
});

test("Coding Jam salva: já abre marcada e, sozinha na agenda, o aviso de 'nenhuma palestra salva' não aparece", () => {
  const { agendaEl, toggleEl, emptyEl } = mount({ withParallel: true, saved: [parallelKey()] });
  assert.ok(agendaEl.querySelector(".parallel-card").classList.contains("is-fav"));
  toggleEl.click();
  assert.equal(emptyEl.hidden, true, "tem a Coding Jam salva: não mostra o vazio");
  const none = mount({ withParallel: true });
  none.toggleEl.click();
  assert.equal(none.emptyEl.hidden, false, "nada salvo: mostra o aviso");
});

test("sem repositório de favoritos o card da sessão em paralelo não ganha estrela", () => {
  document.body.innerHTML = `<div id="agenda"></div>`;
  g("renderAgenda")(schedule, tracks, "America/Sao_Paulo", document.getElementById("agenda"), { parallel: [placement], parallelTexts });
  assert.ok(document.querySelector(".parallel-card"));
  assert.equal(document.querySelector(".parallel-card .fav-btn"), null);
});
