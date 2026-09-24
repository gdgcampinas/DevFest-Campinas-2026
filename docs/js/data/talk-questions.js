/**
 * Perguntas ao vivo por palestra: configuração. `enabled` é a chave geral
 * (só ligar depois que as regras do Firestore de "talk-questions" e "talk-question-votes"
 * estiverem publicadas, ver DevFestIA/firebase/firestore.rules).
 *   maxLength     tamanho máximo do texto (espelhar a regra do Firestore)
 *   maxPerPerson  perguntas por pessoa por palestra (espelhar as regras: entryKey "#1" a "#N")
 *   pollMs     de quanto em quanto tempo a lista se atualiza com o modal aberto
 */
const TALK_QUESTIONS = {
  enabled: true,
  maxLength: 280,
  maxPerPerson: 10,
  pollMs: 15000,
};

const talkQuestionsConfigRepository = createRepository(TALK_QUESTIONS);
