/**
 * Perguntas ao vivo por palestra: configuração. `enabled` é a chave geral
 * (só ligar depois que as regras do Firestore de "talk-questions" e "talk-question-votes"
 * estiverem publicadas, ver DevFestIA/firebase/firestore.rules).
 *   enforceWindow trava de horário: false = pergunta e voto a qualquer hora (teste em DEV); true = só durante a palestra.
 *                 LIGAR ANTES DO EVENTO, junto com `windowEnforced()` das regras do Firestore (um teste confere que são iguais).
 *   maxLength     tamanho máximo do texto (espelhar a regra do Firestore)
 *   maxPerPerson  perguntas por pessoa por palestra (espelhar as regras: entryKey "#1" a "#N")
 *   pollMs        de quanto em quanto tempo a lista se atualiza com o modal aberto (plateia)
 *   boardPollMs   idem na tela do moderador e no quadro da sala (mais curto: é o que a sala está vendo)
 */
/**
 * Estados de uma pergunta (campo `status`, o mesmo das regras do Firestore): nasce "pending"; o moderador aprova
 * ("approved": aparece pra plateia e no quadro da sala), põe na vez ("current": a que está sendo respondida agora,
 * uma por palestra), marca como respondida ("answered"), rejeita ("rejected") ou devolve pra fila ("pending").
 */
const QUESTION_STATUS = Object.freeze({ pending: "pending", approved: "approved", current: "current", answered: "answered", rejected: "rejected" });

/** Estados que a plateia e o quadro enxergam, na ordem em que aparecem (a da vez primeiro). ESPELHAR a regra `list` das perguntas. */
const PUBLIC_QUESTION_STATUSES = Object.freeze([QUESTION_STATUS.current, QUESTION_STATUS.approved]);

const TALK_QUESTIONS = {
  enabled: true,
  enforceWindow: false,
  maxLength: 280,
  maxPerPerson: 10,
  pollMs: 15000,
  boardPollMs: 5000,
};

const talkQuestionsConfigRepository = createRepository(TALK_QUESTIONS);
