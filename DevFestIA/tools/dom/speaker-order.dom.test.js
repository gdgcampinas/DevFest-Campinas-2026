/**
 * Testes da ordem dos palestrantes: a página Palestrantes em ordem alfabética (sortSpeakersByName, features/speakers.js) e os Destaques da home com UM de cada trilha
 * (pickOnePerTrack, features/featured-speakers.js), com o anel e o rótulo na cor da trilha.
 *   node --test DevFestIA/tools/dom/speaker-order.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({
  globals: { TextEncoder: require("node:util").TextEncoder },
  scripts: [...SITE_BASE, "data/talk-formats.js", "data/favorites.js", "components/escape-html.js", "components/avatar.js", "components/speaker-link.js", "components/favorite-button.js", "components/person-card.js", "components/talk-highlight.js",
    "components/talk-meta.js", "components/track-card.js", "features/speakers.js", "features/featured-speakers.js", "features/speaker-photo-zoom.js"],
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

test("Destaques: 4 vagas, nunca duas pessoas da mesma trilha quando há trilhas de sobra, e todas as trilhas aparecem ao longo dos sorteios", () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const picked = g("pickOnePerTrack")(pool, 4);
    assert.equal(picked.length, 4);
    const trackIds = picked.map(speaker => speaker.track.id);
    assert.equal(new Set(trackIds).size, 4, `trilhas repetidas: ${trackIds}`);
    trackIds.forEach(id => seen.add(id));
  }
  assert.equal(seen.size, 5, "com 5 trilhas e 4 vagas, cada trilha entra em algum sorteio");
});

test("Destaques: com menos trilhas que vagas completa com quem sobrou, sem repetir pessoa; pool pequeno devolve todos", () => {
  const twoTracks = [person("A", 0), person("B", 0), person("C", 1), person("D", 1), person("E", 1)];
  const picked = g("pickOnePerTrack")(twoTracks, 4);
  assert.equal(picked.length, 4);
  assert.equal(new Set(picked).size, 4);
  assert.equal(g("pickOnePerTrack")([person("Só", 0)], 4).length, 1);
  assert.deepEqual([...g("pickOnePerTrack")([], 4)], []);
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
