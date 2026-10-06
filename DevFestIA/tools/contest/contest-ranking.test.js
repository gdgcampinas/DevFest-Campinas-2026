/**
 * Testa, sem navegador, a contagem do concurso da sessão (docs/js/features/contest-ranking.js, funções puras): ordem por votos,
 * desempate, voto em projeto apagado e o pódio (só quem tem voto, no máximo `size`).
 *   node --test DevFestIA/tools/contest/contest-ranking.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { rankProjects, buildPodium } = require(path.join(__dirname, "..", "..", "..", "docs/js/features/contest-ranking.js"));

const project = (id, name, createdAtMs, extra = "") => ({ id, project: `Projeto ${id}${extra}`, name, createdAtMs });
const vote = projectId => ({ projectId });
const projects = [project("a", "Ana", 100), project("b", "Bia", 200), project("c", "Caio", 300), project("d", "Dora", 400)];

test("ordena por votos, do maior para o menor", () => {
  const ranking = rankProjects(projects, [vote("c"), vote("c"), vote("b"), vote("c"), vote("b"), vote("a")]);
  assert.deepEqual(ranking.map(item => [item.id, item.votes]), [["c", 3], ["b", 2], ["a", 1], ["d", 0]]);
});

test("empate fica com quem cadastrou o projeto primeiro", () => {
  const ranking = rankProjects(projects, [vote("d"), vote("b"), vote("c")]);
  assert.deepEqual(ranking.map(item => item.id), ["b", "c", "d", "a"]);
});

test("sem votos nenhum projeto some: todos aparecem com 0, na ordem do cadastro", () => {
  assert.deepEqual(rankProjects(projects, []).map(item => [item.id, item.votes]), [["a", 0], ["b", 0], ["c", 0], ["d", 0]]);
});

test("voto em projeto que não existe mais é ignorado", () => {
  const ranking = rankProjects(projects, [vote("apagado"), vote("apagado"), vote("a")]);
  assert.deepEqual(ranking.map(item => item.id), ["a", "b", "c", "d"]);
  assert.equal(ranking.length, 4);
});

test("não muda a lista original", () => {
  const original = projects.map(item => item.id);
  rankProjects(projects, [vote("d")]);
  assert.deepEqual(projects.map(item => item.id), original);
});

test("pódio: os `size` primeiros com voto, com lugar, projeto e nome", () => {
  const ranking = rankProjects(projects, [vote("c"), vote("c"), vote("b"), vote("a"), vote("d")]);
  assert.deepEqual(buildPodium(ranking, 3), [
    { place: 1, project: "Projeto c", name: "Caio" },
    { place: 2, project: "Projeto a", name: "Ana" },
    { place: 3, project: "Projeto b", name: "Bia" },
  ]);
});

test("pódio: ninguém sem voto entra, então pode ter menos que `size`", () => {
  const ranking = rankProjects(projects, [vote("b")]);
  assert.deepEqual(buildPodium(ranking, 3), [{ place: 1, project: "Projeto b", name: "Bia" }]);
  assert.deepEqual(buildPodium(rankProjects(projects, []), 3), []);
  assert.deepEqual(buildPodium([], 3), []);
});
