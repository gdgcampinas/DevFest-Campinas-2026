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

if (typeof module !== "undefined") module.exports = { createRotation };
