/**
 * Ordenação das perguntas de uma palestra. Funções puras (sem DOM nem
 * Firebase); arquivo "dual" (navegador e Node) pra DevFestIA/tools/questions
 * testar a regra sem navegador.
 *
 * Entrada: `questions` e `votes` como vêm de firestoreRepository.getWhere()
 * ({ id, ..., createdAtMs }). Um voto aponta pra pergunta por `entryKey`
 * (id da pergunta) e o id do voto é "<uid>_<id da pergunta>", então "eu já
 * votei" e "a pergunta é minha" saem só do id, sem estado local.
 * Ordem: mais votadas primeiro; empate, a mais antiga primeiro.
 * Ocultas somem, a menos que `includeHidden` (tela do moderador, que as
 * mostra por último pra poder reexibir).
 */
function rankQuestions(questions, votes, { myUid = null, includeHidden = false } = {}) {
  const counts = new Map();
  votes.forEach(vote => counts.set(vote.entryKey, (counts.get(vote.entryKey) ?? 0) + 1));
  const voteIds = new Set(votes.map(vote => vote.id));
  return questions
    .filter(question => includeHidden || !question.hidden)
    .map(question => ({
      ...question,
      votes: counts.get(question.id) ?? 0,
      voted: myUid !== null && voteIds.has(`${myUid}_${question.id}`),
      mine: myUid !== null && question.id.startsWith(`${myUid}_`),
    }))
    .sort((a, b) => Number(Boolean(a.hidden)) - Number(Boolean(b.hidden)) || b.votes - a.votes || a.createdAtMs - b.createdAtMs);
}

if (typeof module !== "undefined") module.exports = { rankQuestions };
