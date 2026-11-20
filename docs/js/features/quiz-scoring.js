/**
 * Pontuação do quiz "Monte sua trilha". Funções puras, sem DOM e sem
 * dado global: perguntas, respostas, índice de palestras e assuntos entram por parâmetro.
 * Arquivo "dual" (script no navegador, módulo CommonJS no Node), pra
 * DevFestIA/tools/check-quiz.js testar a regra sem navegador.
 */

/**
 * Ordena ids pelos pontos (maior primeiro). Empate: vence quem vem primeiro em `ids` (ordem estável e previsível).
 * Devolve { scores, ranking: [id...], winnerId, runnerUpId } (`runnerUpId` só se o segundo pontuou).
 */
function rankScores(scores, ids) {
  const ranking = [...ids].sort((a, b) => scores[b] - scores[a] || ids.indexOf(a) - ids.indexOf(b));
  return { scores, ranking, winnerId: ranking[0], runnerUpId: scores[ranking[1]] > 0 ? ranking[1] : null };
}

/**
 * Soma os pesos das respostas escolhidas; os ids em `weights` são os `ids` recebidos (os assuntos do quiz).
 * `choices` é { [questionId]: answerId }; pergunta sem resposta não pontua.
 */
function scoreQuiz(questions, choices, ids) {
  const scores = Object.fromEntries(ids.map(id => [id, 0]));
  questions.forEach(question => {
    const answer = question.answers.find(candidate => candidate.id === choices[question.id]);
    if (!answer) return;
    Object.entries(answer.weights).forEach(([id, weight]) => {
      if (id in scores) scores[id] += weight;
    });
  });
  return rankScores(scores, ids);
}

/** Pontos de uma palestra: soma da pontuação de cada assunto dela. */
const talkScore = (topics, topicScores) => topics.reduce((sum, topic) => sum + (topicScores[topic] ?? 0), 0);

/**
 * Palestras que pontuam (> 0), da maior pra menor. Empate: horário mais cedo, depois a ordem do índice.
 * `entries` são as linhas de buildTalkIndex() (`slotIndex`, `track`, `data`); `topicsOf(data)` devolve os assuntos da palestra.
 * Vaga sem palestrante não tem assunto, então nunca pontua.
 */
function scoreTalks(entries, topicScores, topicsOf) {
  return entries
    .map((entry, order) => ({ entry, order, score: talkScore(topicsOf(entry.data), topicScores) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.slotIndex - b.entry.slotIndex || a.order - b.order);
}

/** Trilhas pela soma das `topPerTrack` melhores palestras de cada uma (o quanto a trilha entrega do que a pessoa quer). */
function rankTracks(scoredTalks, trackIds, topPerTrack) {
  const scores = Object.fromEntries(trackIds.map(id => [
    id,
    scoredTalks.filter(item => item.entry.track.id === id).slice(0, topPerTrack).reduce((sum, item) => sum + item.score, 0),
  ]));
  return rankScores(scores, trackIds);
}

/** Mini-agenda: a melhor palestra de cada horário (ninguém assiste duas ao mesmo tempo), as `count` melhores desses horários, em ordem de horário. */
function pickAgenda(scoredTalks, count) {
  const bestBySlot = new Map();
  scoredTalks.forEach(item => {
    if (!bestBySlot.has(item.entry.slotIndex)) bestBySlot.set(item.entry.slotIndex, item.entry);
  });
  return [...bestBySlot.values()].slice(0, count).sort((a, b) => a.slotIndex - b.slotIndex);
}

/** Até `count` itens espalhados de forma uniforme pela lista (manhã, meio, tarde), em vez dos primeiros. */
function pickSpread(items, count) {
  if (items.length <= count) return [...items];
  return Array.from({ length: count }, (_, i) => items[Math.round((i * (items.length - 1)) / (count - 1 || 1))]);
}

if (typeof module !== "undefined") module.exports = { rankScores, scoreQuiz, talkScore, scoreTalks, rankTracks, pickAgenda, pickSpread };
