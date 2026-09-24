/**
 * Pontuação do quiz "Monte sua trilha". Funções puras, sem DOM e sem
 * dado global: perguntas, respostas e ids de trilha entram por parâmetro.
 * Arquivo "dual" (script no navegador, módulo CommonJS no Node), pra
 * DevFestIA/tools/check-quiz.js testar a regra sem navegador.
 */

/**
 * Soma os pesos das respostas escolhidas.
 * `choices` é { [questionId]: answerId }; pergunta sem resposta não pontua.
 * Empate: vence a trilha que vem primeiro em `trackIds` (ordem estável e previsível).
 * Devolve { scores, ranking: [trackId...], winnerId, runnerUpId }.
 */
function scoreQuiz(questions, choices, trackIds) {
  const scores = Object.fromEntries(trackIds.map(id => [id, 0]));
  questions.forEach(question => {
    const answer = question.answers.find(candidate => candidate.id === choices[question.id]);
    if (!answer) return;
    Object.entries(answer.weights).forEach(([trackId, weight]) => {
      if (trackId in scores) scores[trackId] += weight;
    });
  });
  const ranking = [...trackIds].sort((a, b) => scores[b] - scores[a] || trackIds.indexOf(a) - trackIds.indexOf(b));
  return { scores, ranking, winnerId: ranking[0], runnerUpId: scores[ranking[1]] > 0 ? ranking[1] : null };
}

/** Até `count` itens espalhados de forma uniforme pela lista (manhã, meio, tarde), em vez dos primeiros. */
function pickSpread(items, count) {
  if (items.length <= count) return [...items];
  return Array.from({ length: count }, (_, i) => items[Math.round((i * (items.length - 1)) / (count - 1 || 1))]);
}

if (typeof module !== "undefined") module.exports = { scoreQuiz, pickSpread };
