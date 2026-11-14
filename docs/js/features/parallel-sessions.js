/**
 * Onde cada rodada das sessões em paralelo (data/parallel-sessions.js) entra na grade. Puro: o horário vira Date por `toDate` (HH:MM → Date, o `eventTime` do schedule.js), nada de DOM.
 * A faixa entra ANTES da primeira sessão da grade que começa a partir do horário da rodada (`index` = posição em SCHEDULE); se nenhuma começa depois, vai para o fim
 * (`index` = schedule.length). A lista sai ordenada pelo horário da rodada.
 */
function parallelPlacements(sessions, schedule, toDate) {
  return sessions.flatMap(session => session.rounds.map((round, roundIndex) => {
    const start = toDate(round.start);
    const found = schedule.findIndex(slot => slot.start >= start);
    return { session, round, roundIndex, start, end: toDate(round.end), index: found === -1 ? schedule.length : found };
  })).sort((a, b) => a.start - b.start);
}

/** "1ª rodada, das 10:00 às 12:00" por rodada: o `template` ({n}, {start}, {end}) vem do dicionário de quem mostra (já traduzido). */
function parallelRoundLines(session, template) {
  return session.rounds.map((round, index) => interpolate(template, { n: index + 1, start: round.start, end: round.end }));
}
