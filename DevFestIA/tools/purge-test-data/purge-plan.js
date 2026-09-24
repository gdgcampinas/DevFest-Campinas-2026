/**
 * Regras (puras) da limpeza dos dados de teste. Apagar dado de verdade é
 * irreversível, então TODAS as travas ficam aqui, num lugar só e testável:
 *   1) só coleções da lista fixa PURGEABLE_COLLECTIONS (nunca Sympla: registrations,
 *      event-stats, sync-state), sem parâmetro que permita outra;
 *   2) recusa a partir do início do evento (depois disso os dados são reais);
 *   3) simulação por padrão: só apaga com dryRun falso E confirmação exata.
 */
const PURGEABLE_COLLECTIONS = ["checkins", "talk-feedback", "event-feedback", "talk-questions", "talk-question-votes"];
const CONFIRMATION_WORD = "APAGAR";

function planPurge({ dryRun = true, confirm = "", now, startsAt }) {
  if (now >= startsAt) return { allowed: false, deleting: false, reason: "O evento já começou: os dados agora são reais e não podem ser apagados por aqui." };
  if (!dryRun && confirm !== CONFIRMATION_WORD) return { allowed: false, deleting: false, reason: `Para apagar de verdade, digite ${CONFIRMATION_WORD} no campo de confirmação (ou deixe o modo teste ligado).` };
  return { allowed: true, deleting: !dryRun, reason: "" };
}

module.exports = { planPurge, PURGEABLE_COLLECTIONS, CONFIRMATION_WORD };
