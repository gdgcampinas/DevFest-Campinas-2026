/**
 * Rodízio de listas entre as passadas de uma cena (docs/js/features/mural-rotation.js): cada passada mostra o próximo, volta ao começo, chaves iguais dividem o cursor e lista vazia devolve -1.
 *   node --test DevFestIA/tools/mural/rotation.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createRotation } = load("features/mural-rotation.js");

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
