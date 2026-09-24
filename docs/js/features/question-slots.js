/**
 * Espaços de pergunta de uma pessoa numa palestra. Cada pergunta ocupa "<chave da palestra>#<n>" (n de 1 até
 * `maxPerPerson`), que é o `entryKey` do documento: o id fixo por espaço é o que faz o banco recusar a pergunta
 * de número maior que o limite. Funções puras, arquivo "dual" (navegador e Node).
 */
const questionEntryKey = (talkKey, slot) => `${talkKey}#${slot}`;

/** Primeiro espaço livre (1..max) dado o que a pessoa já usou; 0 quando o limite acabou. */
function firstFreeQuestionSlot(usedEntryKeys, talkKey, maxPerPerson) {
  const used = new Set(usedEntryKeys);
  for (let slot = 1; slot <= maxPerPerson; slot++) {
    if (!used.has(questionEntryKey(talkKey, slot))) return slot;
  }
  return 0;
}

if (typeof module !== "undefined") module.exports = { questionEntryKey, firstFreeQuestionSlot };
