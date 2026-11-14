/**
 * Onde cada rodada das sessões em paralelo (data/parallel-sessions.js) entra na grade. Puro: o horário vira Date por `toDate` (HH:MM → Date, o `eventTime` do schedule.js), nada de DOM.
 * O card cobre as sessões da grade que COMEÇAM dentro da rodada (`from`..`to`, posições em SCHEDULE, `to` inclusive). Se nenhuma começa dentro dela, `to = from - 1`
 * (faixa vazia) e o card entra sozinho antes da primeira sessão que começa depois (ou no fim). `findHost(nome)` (o `findByName` de data/sponsors.js) liga a marca que faz a sessão;
 * a lista sai ordenada pelo horário da rodada.
 */
function parallelPlacements(sessions, schedule, toDate, { findHost = () => undefined } = {}) {
  return sessions.flatMap(session => session.rounds.map((round, roundIndex) => {
    const start = toDate(round.start);
    const end = toDate(round.end);
    const inside = schedule.map((slot, index) => (slot.start >= start && slot.start < end ? index : -1)).filter(index => index !== -1);
    const after = schedule.findIndex(slot => slot.start >= start);
    const from = inside.length ? inside[0] : after === -1 ? schedule.length : after;
    return { session, round, roundIndex, start, end, from, to: inside.length ? inside[inside.length - 1] : from - 1, host: resolveParallelHost(session, findHost) };
  })).sort((a, b) => a.start - b.start);
}

/** A marca que faz a sessão: { name, logo, link, instagram } com o que `findHost` achar em data/sponsors.js; sem marca, `null`. */
function resolveParallelHost(session, findHost) {
  const sponsor = session.host && findHost(session.host.sponsor);
  return sponsor ? { name: sponsor.name, logo: sponsor.imageUrl, link: sponsor.link, instagram: session.host.instagram } : null;
}

/** "1ª rodada, das 10:00 às 12:00" por rodada: o `template` ({n}, {start}, {end}) vem do dicionário de quem mostra (já traduzido). */
function parallelRoundLines(session, template) {
  return session.rounds.map((round, index) => interpolate(template, { n: index + 1, start: round.start, end: round.end }));
}
