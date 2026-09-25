/**
 * Plano de mudança de estado de uma pergunta. Função pura (sem DOM nem Firebase), arquivo "dual" (navegador e Node)
 * pra DevFestIA/tools/questions testar sem navegador. Devolve a lista ORDENADA de atualizações `{ id, status }` que a
 * tela do moderador tem que gravar: marcar uma pergunta como "current" primeiro rebaixa a que já estava na vez pra
 * "approved" (só uma na vez por palestra; o banco não garante isso, ver firestore.rules). Qualquer outra mudança é
 * uma atualização só. `questions` são os documentos da palestra ({ id, status }).
 */
function planStatusChange(questions, id, to, { currentStatus = "current", demoteTo = "approved" } = {}) {
  if (to !== currentStatus) return [{ id, status: to }];
  const previous = questions.filter(question => question.status === currentStatus && question.id !== id);
  return [...previous.map(question => ({ id: question.id, status: demoteTo })), { id, status: to }];
}

if (typeof module !== "undefined") module.exports = { planStatusChange };
