/**
 * Baralho dos Destaques da home (features/featured-speakers.js): puro, sem DOM nem relógio; `random` entra por parâmetro (testes).
 * Garante o que o evento pede: TODOS os palestrantes aparecem, ninguém repete antes de todos terem aparecido (nem na mesma tela, nem na troca seguinte)
 * e NADA é fixo: quem fala na plenária e o card do Coding Jam entram no baralho como todo mundo.
 *   - cada volta embaralha (Fisher-Yates, sem viés) e espalha as trilhas, para as pessoas de uma tela virem de trilhas diferentes quando há trilhas de sobra (`spreadByTrack`)
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

const trackKeyOf = person => person.track?.id ?? person.name; // quem não tem trilha conta como trilha própria

/**
 * Uma volta inteira, cada pessoa uma vez, espalhada por trilha: em qualquer janela de `window` pessoas seguidas as trilhas são diferentes enquanto isso for possível
 * (escolhe sempre a trilha com mais gente sobrando, entre as que não saíram nas últimas `window - 1`; empate no sorteio). Telas de `window` pessoas saem com uma de cada trilha.
 */
function spreadByTrack(people, window, random = Math.random) {
  const groups = new Map();
  shuffled(people, random).forEach(person => {
    const key = trackKeyOf(person);
    groups.set(key, [...(groups.get(key) ?? []), person]);
  });
  const order = [];
  const recent = [];
  while (order.length < people.length) {
    const open = [...groups.entries()].filter(([, items]) => items.length);
    const allowed = open.filter(([key]) => !recent.includes(key));
    const pool = allowed.length ? allowed : open;
    const most = Math.max(...pool.map(([, items]) => items.length));
    const [key, items] = shuffled(pool.filter(([, left]) => left.length === most), random)[0];
    order.push(items.pop());
    recent.push(key);
    if (recent.length > window - 1) recent.shift();
  }
  return order;
}

/**
 * `next()` devolve a próxima tela: `slots` itens do baralho, no máximo, sem ninguém repetido na tela e, havendo trilhas de sobra, UM DE CADA TRILHA. `people` = tudo o que entra
 * no baralho (os palestrantes e o card do Coding Jam). Sem ninguém, devolve uma tela vazia. Cada volta passa por todos exatamente uma vez; a volta nova tenta (algumas ordens)
 * não começar com quem estava na tela anterior, e uma tela que cruza o fim da volta completa com quem tem trilha diferente.
 */
function createFeaturedDeck(people, { slots, random = Math.random } = {}) {
  const size = Math.min(slots, people.length);
  let queue = [];
  let lastFrame = [];
  const refill = avoid => {
    const clear = order => !order.slice(0, size * 2).some(person => avoid.includes(person));
    let order = spreadByTrack(people, size, random);
    for (let attempt = 0; attempt < 40 && !clear(order); attempt++) order = spreadByTrack(people, size, random);
    queue = clear(order) ? order : [...order.filter(person => !avoid.includes(person)), ...order.filter(person => avoid.includes(person))];
  };
  return {
    next() {
      const frame = [];
      while (frame.length < size) {
        if (!queue.length) refill([...frame, ...lastFrame]);
        const usedTracks = new Set(frame.map(trackKeyOf));
        let index = queue.findIndex(person => !frame.includes(person) && !usedTracks.has(trackKeyOf(person)));
        if (index === -1) index = queue.findIndex(person => !frame.includes(person)); // menos trilhas que vagas: só não repete a pessoa
        if (index === -1) { queue = []; continue; }
        frame.push(...queue.splice(index, 1));
      }
      lastFrame = frame;
      return frame;
    },
  };
}
