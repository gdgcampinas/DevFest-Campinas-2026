/**
 * Relatório do evento (puro, só calcula e formata): junta os números do
 * Sympla (inscritos, presença na porta) com o que o site coletou no
 * Firestore (check-in e avaliação por palestra, avaliação do evento).
 * Recebe a grade (`talks`: chave -> título, trilha, horário, palestrantes) e
 * as perguntas do evento (`form`) por parâmetro, então não sabe de onde vêm.
 * Relatório PRIVADO: inclui os comentários (e o nome, quando a pessoa deu um).
 */
const average = values => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
const groupBy = (items, keyFn) => items.reduce((acc, item) => ({ ...acc, [keyFn(item)]: [...(acc[keyFn(item)] ?? []), item] }), {});
const numbers = (items, field) => items.map(item => item[field]).filter(Number.isFinite);
const round = value => (value === null ? "-" : value.toFixed(2));
const pct = value => (value === null ? "-" : `${(value * 100).toFixed(1)}%`);

function distribution(ratings) {
  return [5, 4, 3, 2, 1].map(stars => ({ stars, count: ratings.filter(rating => rating === stars).length }));
}

function comments(items) {
  return items.flatMap(item => [
    item.highlight && { kind: "gostou", text: item.highlight, name: item.name },
    item.improve && { kind: "melhorar", text: item.improve, name: item.name },
  ].filter(Boolean));
}

/** Nota de indicação: promotores (9-10) menos detratores (0-6), em pontos percentuais (-100 a 100). */
function netPromoterScore(scores) {
  if (!scores.length) return null;
  const promoters = scores.filter(score => score >= 9).length;
  const detractors = scores.filter(score => score <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

function buildEventReport({ stats, checkins, talkFeedback, eventFeedback, talks, form }) {
  const feedbackByTalk = groupBy(talkFeedback, item => item.entryKey);
  const checkinsByTalk = groupBy(checkins, item => item.entryKey);
  const knownKeys = [...talks.keys()];
  const extraKeys = [...new Set([...Object.keys(checkinsByTalk), ...Object.keys(feedbackByTalk)])].filter(key => !talks.has(key)).sort();

  const talkRows = [...knownKeys, ...extraKeys]
    .filter(key => checkinsByTalk[key] || feedbackByTalk[key])
    .map(key => {
      const feedback = feedbackByTalk[key] ?? [];
      const ratings = numbers(feedback, "rating");
      const info = talks.get(key) ?? { title: key, track: "", time: "", speakers: [] };
      return { key, ...info, checkins: (checkinsByTalk[key] ?? []).length, ratings: ratings.length, average: average(ratings), distribution: distribution(ratings), comments: comments(feedback) };
    });

  const speakerRatings = {};
  talkRows.forEach(row => row.speakers.forEach(name => { speakerRatings[name] = [...(speakerRatings[name] ?? []), ...numbers(feedbackByTalk[row.key] ?? [], "rating")]; }));
  const speakers = Object.entries(speakerRatings).filter(([, ratings]) => ratings.length)
    .map(([name, ratings]) => ({ name, ratings: ratings.length, average: average(ratings) })).sort((a, b) => b.average - a.average);

  const eventRatings = numbers(eventFeedback, "rating");
  const nps = numbers(eventFeedback, "nps");
  return {
    registered: stats.total,
    checkedInAtDoor: stats.checkedIn,
    attendanceRate: stats.total ? stats.checkedIn / stats.total : null,
    talkCheckins: checkins.length,
    talkRatings: talkFeedback.length,
    talkAverage: average(numbers(talkFeedback, "rating")),
    talks: talkRows,
    speakers,
    event: {
      ratings: eventRatings.length,
      average: average(eventRatings),
      distribution: distribution(eventRatings),
      aspects: form.aspects.map(aspect => {
        const values = eventFeedback.map(item => item.aspects?.[aspect.id]).filter(Number.isFinite);
        return { id: aspect.id, label: aspect.label, ratings: values.length, average: average(values) };
      }),
      nps: { score: netPromoterScore(nps), answers: nps.length },
      comments: comments(eventFeedback),
    },
  };
}

const stars = row => row.distribution.map(item => `${item.stars}★ ${item.count}`).join(" · ");
const quote = comment => `  - (${comment.kind}) ${comment.text}${comment.name ? ` — ${comment.name}` : ""}`;

function formatEventReport(report, { edition }) {
  const talkBlocks = report.talks.map(talk => [
    `### ${talk.time ? `${talk.time} · ` : ""}${talk.title}`,
    `${[talk.track, talk.speakers.join(", ")].filter(Boolean).join(" · ")}`,
    `Check-ins: ${talk.checkins} · Avaliações: ${talk.ratings} · Nota média: **${round(talk.average)}**${talk.ratings ? ` (${stars(talk)})` : ""}`,
    ...talk.comments.map(quote),
    "",
  ].filter(line => line !== "").join("\n"));
  return [
    `## Relatório DevFest ${edition}`,
    "",
    `- Inscritos: **${report.registered}**`,
    `- Presentes na porta (check-in Sympla): **${report.checkedInAtDoor}** (${pct(report.attendanceRate)})`,
    `- Check-ins em palestras: ${report.talkCheckins}`,
    `- Avaliações de palestra: ${report.talkRatings}, nota média ${round(report.talkAverage)}`,
    "",
    "## O evento",
    `- Avaliações: ${report.event.ratings}, nota geral **${round(report.event.average)}** (${stars(report.event)})`,
    `- Indicação (0 a 10): **${report.event.nps.score ?? "-"}** pontos, ${report.event.nps.answers} respostas`,
    "",
    "| Aspecto | Respostas | Nota média |",
    "|---|---|---|",
    ...report.event.aspects.map(aspect => `| ${aspect.label} | ${aspect.ratings} | ${round(aspect.average)} |`),
    "",
    ...(report.event.comments.length ? ["**Comentários do evento**", ...report.event.comments.map(quote), ""] : []),
    "## Por palestrante",
    "| Palestrante | Avaliações | Nota média |",
    "|---|---|---|",
    ...report.speakers.map(speaker => `| ${speaker.name} | ${speaker.ratings} | ${round(speaker.average)} |`),
    "",
    "## Palestras (com check-in ou avaliação)",
    "",
    ...talkBlocks.flatMap(block => [block, ""]),
  ].join("\n");
}

module.exports = { buildEventReport, formatEventReport, netPromoterScore };
