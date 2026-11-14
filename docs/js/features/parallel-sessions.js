/**
 * Onde cada rodada das sessões em paralelo (data/parallel-sessions.js) entra na grade. Puro: o horário vira Date por `toDate` (HH:MM → Date, o `eventTime` do schedule.js), nada de DOM.
 * O card cobre as sessões da grade que COMEÇAM dentro da rodada (`from`..`to`, posições em SCHEDULE, `to` inclusive). Se nenhuma começa dentro dela, `to = from - 1`
 * (faixa vazia) e o card entra sozinho antes da primeira sessão que começa depois (ou no fim). `findHost(nome)` (o `findByName` de data/sponsors.js) liga a marca que faz a sessão e `findHighlight(id)` (o `getById` de data/talk-highlights.js) o destaque dela;
 * a lista sai ordenada pelo horário da rodada.
 */
function parallelPlacements(sessions, schedule, toDate, { findHost = () => undefined, findHighlight = () => undefined } = {}) {
  return sessions.flatMap(session => session.rounds.map((round, roundIndex) => {
    const start = toDate(round.start);
    const end = toDate(round.end);
    const inside = schedule.map((slot, index) => (slot.start >= start && slot.start < end ? index : -1)).filter(index => index !== -1);
    const after = schedule.findIndex(slot => slot.start >= start);
    const from = inside.length ? inside[0] : after === -1 ? schedule.length : after;
    return { session, round, roundIndex, start, end, from, to: inside.length ? inside[inside.length - 1] : from - 1, host: resolveParallelHost(session, findHost), highlight: findHighlight(session.highlightId) };
  })).sort((a, b) => a.start - b.start);
}

/** Quem faz a sessão, no formato de quem fala: { name, photo, social: [{ name, link }] } (o logo da marca vira a foto; Linktree e Instagram viram ícones); sem marca achada, `null`. */
function resolveParallelHost(session, findHost) {
  const sponsor = session.host && findHost(session.host.sponsor);
  if (!sponsor) return null;
  const social = [{ name: "linktree", link: sponsor.link }, { name: "instagram", link: session.host.instagram }].filter(item => item.link);
  return { name: session.host.name ?? sponsor.name, photo: sponsor.imageUrl, social };
}

/** "1ª rodada, das 10:00 às 12:00" por rodada: o `template` ({n}, {start}, {end}) vem do dicionário de quem mostra (já traduzido). */
function parallelRoundLines(session, template) {
  return session.rounds.map((round, index) => interpolate(template, { n: index + 1, start: round.start, end: round.end }));
}

/**
 * A sessão em paralelo no formato de quem aparece em "Destaques" da home (features/featured-speakers.js): gira no baralho como todo mundo, com a Liga (foto e nome de `host`)
 * no lugar de quem fala, a etiqueta da sessão ("Lab de IA") na cor dela e o horário da primeira rodada; leva à página da sessão (`href`). `texts` = data/parallel-sessions.js.
 */
function parallelFeaturedPerson(session, host, texts) {
  const [round] = session.rounds;
  return {
    name: session.name,
    photo: host?.photo,
    title: host?.name,
    track: { color: session.color, label: session.kicker },
    talks: [{ title: `${texts.tag} · ${round.start}–${round.end}` }],
    href: session.href,
  };
}

/** Os cards fixos de "Destaques" das sessões visíveis (`sessions`, ver `parallelSessionsRepository.visible`), cada um com a marca que faz a sessão (`findHost`) e as frases (`texts`). */
function parallelFeaturedPeople({ sessions, findHost, texts }) {
  return sessions.map(session => parallelFeaturedPerson(session, resolveParallelHost(session, findHost), texts));
}
