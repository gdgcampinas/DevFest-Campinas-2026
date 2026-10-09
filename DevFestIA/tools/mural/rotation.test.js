/**
 * Rodízio de listas entre as passadas de uma cena (docs/js/features/mural-rotation.js): cada passada mostra o próximo, volta ao começo, chaves iguais dividem o cursor e lista vazia devolve -1.
 *   node --test DevFestIA/tools/mural/rotation.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createRotation, interleaveGroups } = load("features/mural-rotation.js");

test("avança a cada pedido e volta ao começo no fim da lista", () => {
  const rotation = createRotation();
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(() => rotation.next("time", 3)), [0, 1, 2, 0, 1, 2, 0]);
});

test("chaves diferentes têm cursores separados e a mesma chave divide o cursor", () => {
  const rotation = createRotation();
  assert.equal(rotation.next("a", 5), 0);
  assert.equal(rotation.next("b", 5), 0);
  assert.equal(rotation.next("a", 5), 1);
  assert.equal(rotation.next("a", 5), 2);
  assert.equal(rotation.next("b", 5), 1);
});

test("lista que encolhe nunca devolve posição fora dela e lista vazia devolve -1", () => {
  const rotation = createRotation();
  [0, 1, 2, 3].forEach(() => rotation.next("x", 10));
  assert.ok(rotation.next("x", 3) < 3);
  assert.equal(rotation.next("vazia", 0), -1);
});

test("intercalar por grupo: um de cada grupo por vez, o grupo maior segue sozinho no fim, a lista original não muda e lista vazia devolve vazia", () => {
  const people = [{ n: "o1", g: "org" }, { n: "o2", g: "org" }, { n: "v1", g: "vol" }, { n: "v2", g: "vol" }, { n: "v3", g: "vol" }, { n: "v4", g: "vol" }];
  assert.deepEqual(interleaveGroups(people, person => person.g).map(person => person.n), ["o1", "v1", "o2", "v2", "v3", "v4"]);
  assert.deepEqual(people.map(person => person.n), ["o1", "o2", "v1", "v2", "v3", "v4"]);
  assert.deepEqual(interleaveGroups([], person => person.g), []);
  assert.deepEqual(interleaveGroups(["a", "b"], () => "x"), ["a", "b"], "grupo único mantém a ordem");
  assert.deepEqual(interleaveGroups(people, person => person.g).length, people.length, "ninguém some nem repete");
});
