/**
 * Regras (puras, sem DOM nem Firebase) de quem aparece na roleta do sorteio. DUAL: script clássico no
 * navegador (funções globais) e módulo CommonJS no Node (testado em DevFestIA/tools/raffle/).
 *
 * Com ~1.000 cadastros a roda não pode ter 1.000 fatias (0,36° cada, nome nenhum fica legível): ela mostra no
 * máximo RAFFLE_WHEEL_MAX_SLICES fatias. O sorteio em si sai SEMPRE da lista inteira (chance igual pra todos);
 * a roda é só a encenação, e o sorteado entra nela antes de girar.
 *
 * Tudo por parâmetro (`max`, `random`), nada fixo: quem chama decide o tamanho da roda e injeta o sorteador.
 */
const RAFFLE_WHEEL_MAX_SLICES = 24;
const RAFFLE_ARRIVALS_SHOWN = 6;

/** Nome mostrado na fatia e na faixa de chegadas: nome + ÚLTIMO sobrenome ("Henrique Ferreira Rodrigues da
 * Silva" vira "Henrique Silva"), pra caber e continuar reconhecível. O nome completo só aparece no ganhador. */
function raffleDisplayName(person) {
  const surname = String(person.lastName ?? "").trim().split(/\s+/).pop();
  return [person.firstName, surname].filter(Boolean).join(" ");
}

/** Cópia ordenada pela chegada (mais antigo primeiro). Quem ainda não tem horário (`createdAtMs` 0, o servidor
 * ainda não confirmou) fica no fim, na ordem em que veio. */
function byArrival(entries) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => ((a.entry.createdAtMs || Infinity) - (b.entry.createdAtMs || Infinity)) || (a.index - b.index))
    .map(item => item.entry);
}

/** Os últimos `count` cadastros, o mais recente primeiro (faixa "Maria acabou de entrar"). */
function recentArrivals(entries, count = RAFFLE_ARRIVALS_SHOWN) {
  return byArrival(entries).reverse().slice(0, count);
}

/** Fatias da roda PARADA (sem giro em andamento): até `max` pessoas em ordem de chegada; acima disso, as
 * `max` mais recentes, assim a roda continua "enchendo" com quem acabou de entrar. */
function idleWheelEntries(pool, max = RAFFLE_WHEEL_MAX_SLICES) {
  return byArrival(pool).slice(-max);
}

/** Sorteia UMA pessoa da lista inteira (chance igual pra todos, não da amostra da roda). */
function pickRaffleWinner(pool, random = Math.random) {
  return pool[Math.floor(random() * pool.length)];
}

/** Monta a roda do giro: o sorteado mais `max - 1` outras pessoas escolhidas ao acaso, em ordem embaralhada
 * (ele cai numa fatia aleatória, nunca sempre na primeira). Com `max` pessoas ou menos, a roda é a lista
 * inteira na ordem de chegada. Devolve a lista de fatias e o índice do sorteado nela. */
function buildSpinWheel(pool, winner, max = RAFFLE_WHEEL_MAX_SLICES, random = Math.random) {
  if (pool.length <= max) {
    const entries = byArrival(pool);
    return { entries, winnerIndex: entries.findIndex(entry => entry.id === winner.id) };
  }
  const others = pool.filter(entry => entry.id !== winner.id);
  for (let i = others.length - 1; i > others.length - max; i--) { // sorteia só as `max - 1` últimas posições
    const j = Math.floor(random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const entries = others.slice(-(max - 1));
  const winnerIndex = Math.floor(random() * (entries.length + 1));
  entries.splice(winnerIndex, 0, winner);
  return { entries, winnerIndex };
}

if (typeof module !== "undefined") module.exports = { RAFFLE_WHEEL_MAX_SLICES, RAFFLE_ARRIVALS_SHOWN, raffleDisplayName, recentArrivals, idleWheelEntries, pickRaffleWinner, buildSpinWheel };
