/**
 * Palestra em GRUPO (painel com 3 ou mais pessoas, ex.: "Infiltradas em Tech", 4 palestrantes): o card mostra as fotos numa linha e os nomes de todo mundo
 * embaixo, sem os LinkedIn (ficam no modal); o modal lista cada pessoa com foto, cargo e LinkedIn; os dados do painel apontam para 4 pessoas reais, cada uma
 * com foto no repositório. Dupla segue o card de sempre.
 *   node --test DevFestIA/tools/dom/group-talk.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const site = loadSite({
  scripts: [...SITE_BASE, "data/talk-formats.js", "data/favorites.js", "components/avatar.js", "components/speaker-link.js", "components/favorite-button.js", "components/person-card.js", "components/talk-highlight.js", "components/talk-meta.js", "components/track-card.js"],
});
const { window, document } = site;
test.after(() => window.close());

const track = { id: "mentoring", label: "Carreira em Tecnologia", shortLabel: "Carreira", color: "#EA4335", room: "Sala Mercadão Central" };
const people = ["Ana Souza", "Bia Lima", "Cris Dias", "Dani Melo"].map(name => ({ name, title: `Cargo de ${name}`, photo: "", linkedin: `https://linkedin.com/in/${name.split(" ")[0].toLowerCase()}` }));
const talk = speakers => ({ title: "Painel em grupo", format: "palestra", tags: [], speakers, description: "Conversa." });
const render = html => { const root = document.createElement("div"); root.innerHTML = html; return root; };
const card = speakers => render(site.get("trackCardMarkup")(track, talk(speakers), { startLabel: "15:00", duration: "40 min", talkKey: "k" }));

test("card de grupo: uma foto por pessoa (até 4), nomes de todas separados por vírgula, layout de grupo e sem LinkedIn no card", () => {
  const root = card(people);
  assert.equal(root.querySelectorAll(".talk-avatar-ring").length, 4);
  assert.equal(textOf(root.querySelector(".talk-name")), "Ana Souza, Bia Lima, Cris Dias, Dani Melo");
  assert.ok(root.querySelector(".talk-who").classList.contains("talk-who--group"));
  assert.equal(root.querySelectorAll(".talk-links").length, 0);
  assert.equal(root.querySelectorAll(".talk-meta").length, 0, "o cargo só aparece com 1 pessoa");
});

test("card de dupla e de 1 pessoa continua igual: nomes com &, LinkedIn no card, sem layout de grupo", () => {
  const pair = card(people.slice(0, 2));
  assert.equal(textOf(pair.querySelector(".talk-name")), "Ana Souza & Bia Lima");
  assert.ok(!pair.querySelector(".talk-who").classList.contains("talk-who--group"));
  assert.equal(pair.querySelectorAll(".talk-links .social-icon").length, 2);
  assert.equal(card(people.slice(0, 1)).querySelectorAll(".talk-meta").length, 1);
});

test("modal de grupo: cada pessoa com nome, cargo e LinkedIn", () => {
  const root = render(site.get("talkDetailMarkup")(track, talk(people), { timeRange: "15:00–15:40", room: track.room, talkKey: "k" }));
  assert.deepEqual([...root.querySelectorAll(".detail-speaker")].map(textOf), people.map(person => person.name));
  assert.deepEqual([...root.querySelectorAll(".detail-speaker-meta")].map(textOf), people.map(person => person.title));
  assert.equal(root.querySelectorAll(".detail-speaker-row .social-icon").length, 4);
});

test("dados: 'Infiltradas em Tech' tem 4 palestrantes distintos, cada um cadastrado com foto no repositório", () => {
  const source = fs.readFileSync(path.join(__dirname, "../../../docs/js/data/schedule.js"), "utf8");
  const rows = eval(`[${source.match(/const LINEUP_SPEAKER_ROWS = \[([\s\S]*?)\n\];/)[1]}]`);
  const byId = Object.fromEntries(rows.map(row => [row[0], row]));
  const ids = JSON.parse(source.match(/\["Infiltradas em Tech[^"]*", (\[[^\]]*\])/)[1]);
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, 4);
  for (const id of ids) {
    assert.ok(byId[id], `${id} falta em LINEUP_SPEAKER_ROWS`);
    assert.ok(fs.existsSync(path.join(__dirname, "../../../docs", byId[id][4])), `foto de ${id} não existe`);
    assert.match(byId[id][5], /^https:\/\/www\.linkedin\.com\/in\//, `LinkedIn de ${id}`);
  }
});
