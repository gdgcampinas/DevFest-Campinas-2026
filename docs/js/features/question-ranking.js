/**
 * Ordenação das perguntas de uma palestra. Funções puras (sem DOM nem Firebase); arquivo "dual" (navegador e
 * Node) pra DevFestIA/tools/questions testar a regra sem navegador.
 *
 * Entrada: `questions` como vêm de firestoreRepository.getWhere() ({ id, ..., createdAtMs }) e `counts`, os votos de
 * cada pergunta ({ [idDaPergunta]: número }, vindos de contagem no servidor: ninguém baixa os votos um a um). "A pergunta
 * é minha" sai só do id ("<uid>_<entryKey>"); "eu já votei" vem de `votedIds` (o que este navegador guarda dos próprios votos).
 *
 * `statuses` (padrão só "approved") filtra E ordena por estado, na ordem dada: a plateia e o quadro usam só as
 * aprovadas; o moderador passa todos ("pending" primeiro). Dentro do estado: pendentes da mais antiga pra mais nova
 * (fila de atendimento); os demais, mais votadas primeiro e, no empate, a mais antiga.
 */
function decorateQuestions(questions, { myUid = null, votedIds = new Set() } = {}) {
  return questions.map(question => ({
    ...question,
    voted: votedIds.has(question.id),
    mine: myUid !== null && question.id.startsWith(`${myUid}_`),
  }));
}

function rankQuestions(questions, counts = {}, { myUid = null, votedIds = new Set(), statuses = ["approved"] } = {}) {
  const rank = status => statuses.indexOf(status);
  const withVotes = questions.filter(question => rank(question.status) >= 0).map(question => ({ ...question, votes: counts[question.id] ?? 0 }));
  return decorateQuestions(withVotes, { myUid, votedIds }).sort((a, b) => rank(a.status) - rank(b.status)
    || (a.status === "pending" ? 0 : b.votes - a.votes)
    || a.createdAtMs - b.createdAtMs);
}

if (typeof module !== "undefined") module.exports = { rankQuestions, decorateQuestions };
