/**
 * Baralho dos Destaques da home (features/featured-speakers.js): puro, sem DOM nem relógio; `random` entra por parâmetro (testes).
 * Garante o que o evento pede: TODOS os palestrantes aparecem, ninguém repete antes de todos terem aparecido (nem na mesma tela, nem na troca seguinte)
 * e ninguém é fixo (quem fala na plenária entra como todo mundo; só `pinned`, o card do Coding Jam, fica em toda tela).
 *   - cada volta embaralha (Fisher-Yates, sem viés) e intercala as trilhas, para as pessoas de uma tela virem de trilhas diferentes quando há trilhas de sobra
 *   - a tela seguinte pega as próximas da fila; a fila acabando, começa outra volta, com quem estava na última tela empurrado para o fim dela
 */
function shuffled(list, random = Math.random) {
  const items = [...list];
  for (let index = items.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items;
}

/** Uma volta inteira: cada trilha embaralhada e as trilhas intercaladas (1º de cada trilha, depois o 2º de cada...); quem não tem trilha conta como trilha própria. */
function interleavedByTrack(people, random = Math.random) {
  const byTrack = new Map();
  shuffled(people, random).forEach(person => {
    const key = person.track?.id ?? person.name;
    byTrack.set(key, [...(byTrack.get(key) ?? []), person]);
  });
  const columns = shuffled([...byTrack.values()], random);
  const rounds = Math.max(0, ...columns.map(column => column.length));
  return Array.from({ length: rounds }, (_, round) => columns.map(column => column[round]).filter(Boolean)).flat();
}

/**
 * `next()` devolve a próxima tela: os `pinned` (em toda tela) mais `slots` pessoas do baralho, no máximo, sem ninguém repetido na tela. `people` = quem entra no baralho
 * (todos os palestrantes). Sem ninguém, devolve só os fixos.
 */
function createFeaturedDeck(people, { slots, pinned = [], random = Math.random } = {}) {
  const size = Math.min(slots, people.length);
  let queue = [];
  let lastFrame = [];
  const refill = avoid => {
    const order = interleavedByTrack(people, random);
    queue = [...order.filter(person => !avoid.includes(person)), ...order.filter(person => avoid.includes(person))];
  };
  return {
    next() {
      const frame = [];
      while (frame.length < size) {
        if (!queue.length) refill([...frame, ...lastFrame]);
        const index = queue.findIndex(person => !frame.includes(person));
        if (index === -1) { queue = []; continue; }
        frame.push(...queue.splice(index, 1));
      }
      lastFrame = frame;
      return [...pinned, ...frame];
    },
  };
}
