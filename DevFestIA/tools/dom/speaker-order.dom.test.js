/**
 * Testes da ordem dos palestrantes: a página Palestrantes em ordem alfabética (sortSpeakersByName, features/speakers.js) e os Destaques da home com UM de cada trilha
 * (pickOnePerTrack, features/featured-speakers.js), com o anel e o rótulo na cor da trilha.
 *   node --test DevFestIA/tools/dom/speaker-order.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/avatar.js", "components/track-card.js", "components/speaker-link.js", "features/speakers.js", "features/featured-speakers.js"] });
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
