/**
 * Rodízio de uma lista entre as passadas de uma cena: cada vez que a cena volta ao ar, mostra o PRÓXIMO item da lista (a pessoa seguinte do time, a pergunta seguinte do quebra-gelo).
 * `next(key, count)` devolve a posição a mostrar agora e avança; a mesma `key` em duas cenas do dado compartilha o cursor (as duas passam pela lista sem repetir). `count` 0 devolve -1.
 * Dual (navegador e Node), sem relógio nem DOM.
 */
function createRotation() {
  const cursors = new Map();
  return {
    next(key, count) {
      if (!count) return -1;
      const index = (cursors.get(key) ?? 0) % count;
      cursors.set(key, (index + 1) % count);
      return index;
    },
  };
}

/**
 * Intercala os itens por grupo: um de cada grupo por vez, na ordem em que os grupos aparecem (A1, B1, A2, B2...); quando um grupo acaba, o resto segue na ordem. `groupOf(item)` diz o grupo.
 * Usada pra o time sortear organizadores e voluntários misturados em vez de passar primeiro por todo mundo de um grupo. Devolve uma lista nova (não mexe na original).
 */
function interleaveGroups(items, groupOf) {
  const groups = new Map();
  items.forEach(item => {
    const key = groupOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  const queues = [...groups.values()];
  const mixed = [];
  for (let round = 0; queues.some(queue => round < queue.length); round++) queues.forEach(queue => { if (round < queue.length) mixed.push(queue[round]); });
  return mixed;
}

if (typeof module !== "undefined") module.exports = { createRotation, interleaveGroups };
