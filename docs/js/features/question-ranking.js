/**
 * Ordenação das perguntas de uma palestra. Funções puras (sem DOM nem Firebase); arquivo "dual" (navegador e
 * Node) pra DevFestIA/tools/questions testar a regra sem navegador.
 *
 * Entrada: `questions` e `votes` como vêm de firestoreRepository.getWhere() ({ id, ..., createdAtMs }). Um voto
 * aponta pra pergunta por `entryKey` (id da pergunta) e o id do voto é "<uid>_<id da pergunta>", então "eu já
 * votei" e "a pergunta é minha" saem só do id, sem estado local.
 *
 * `statuses` (padrão só "approved") filtra E ordena por estado, na ordem dada: a plateia e o quadro passam os
 * públicos (PUBLIC_QUESTION_STATUSES: a da vez primeiro, depois as aprovadas); o moderador passa todos ("pending" primeiro). Dentro do estado: pendentes da mais antiga pra mais nova
 * (fila de atendimento); os demais, mais votadas primeiro e, no empate, a mais antiga.
 */
function rankQuestions(questions, votes, { myUid = null, statuses = ["approved"] } = {}) {
  const counts = new Map();
  votes.forEach(vote => counts.set(vote.entryKey, (counts.get(vote.entryKey) ?? 0) + 1));
  const voteIds = new Set(votes.map(vote => vote.id));
  const rank = status => statuses.indexOf(status);
  return questions
    .filter(question => rank(question.status) >= 0)
    .map(question => ({
      ...question,
      votes: counts.get(question.id) ?? 0,
      voted: myUid !== null && voteIds.has(`${myUid}_${question.id}`),
      mine: myUid !== null && question.id.startsWith(`${myUid}_`),
    }))
    .sort((a, b) => rank(a.status) - rank(b.status)
      || (a.status === "pending" ? 0 : b.votes - a.votes)
      || a.createdAtMs - b.createdAtMs);
}

if (typeof module !== "undefined") module.exports = { rankQuestions };
