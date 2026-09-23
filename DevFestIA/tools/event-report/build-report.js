/**
 * Relatório do evento (puro, só calcula e formata): junta os números do
 * Sympla (inscritos, presença na porta) com o que o site coletou no
 * Firestore (check-in por palestra, notas). Pensado pro media kit e pra
 * prestação de contas com patrocinadores.
 */
const average = values => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
const groupBy = (items, keyFn) => items.reduce((acc, item) => ({ ...acc, [keyFn(item)]: [...(acc[keyFn(item)] ?? []), item] }), {});
const round = value => (value === null ? "-" : value.toFixed(2));

function buildEventReport({ stats, checkins, talkFeedback, eventFeedback }) {
  const ratings = items => items.map(item => item.rating).filter(Number.isFinite);
  const feedbackByTalk = groupBy(talkFeedback, item => item.entryKey);
  const talks = Object.keys({ ...groupBy(checkins, item => item.entryKey), ...feedbackByTalk }).sort().map(key => ({
    key,
    checkins: checkins.filter(item => item.entryKey === key).length,
    ratings: (feedbackByTalk[key] ?? []).length,
    average: average(ratings(feedbackByTalk[key] ?? [])),
  }));
  return {
    registered: stats.total,
    checkedInAtDoor: stats.checkedIn,
    attendanceRate: stats.total ? stats.checkedIn / stats.total : null,
    talkCheckins: checkins.length,
    talkRatings: talkFeedback.length,
    talkAverage: average(ratings(talkFeedback)),
    eventRatings: eventFeedback.length,
    eventAverage: average(ratings(eventFeedback)),
    talks,
  };
}

function formatEventReport(report, { edition }) {
  const pct = value => (value === null ? "-" : `${(value * 100).toFixed(1)}%`);
  return [
    `## Relatório DevFest ${edition}`,
    "",
    `- Inscritos: **${report.registered}**`,
    `- Presentes na porta (check-in Sympla): **${report.checkedInAtDoor}** (${pct(report.attendanceRate)})`,
    `- Check-ins em palestras: ${report.talkCheckins}`,
    `- Avaliações de palestra: ${report.talkRatings}, nota média ${round(report.talkAverage)}`,
    `- Avaliações do evento: ${report.eventRatings}, nota média ${round(report.eventAverage)}`,
    "",
    "| Palestra (slot e trilha) | Check-ins | Avaliações | Nota média |",
    "|---|---|---|---|",
    ...report.talks.map(talk => `| ${talk.key} | ${talk.checkins} | ${talk.ratings} | ${round(talk.average)} |`),
  ].join("\n");
}

module.exports = { buildEventReport, formatEventReport };
