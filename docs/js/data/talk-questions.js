/**
 * Perguntas ao vivo por palestra: configuração. `enabled` é a chave geral
 * (false até as regras do Firestore de "talk-questions" e "talk-question-votes"
 * estarem publicadas, ver DevFestIA/firebase/firestore.rules).
 *   maxLength  tamanho máximo do texto (espelhar a regra do Firestore)
 *   pollMs     de quanto em quanto tempo a lista se atualiza com o modal aberto
 */
const TALK_QUESTIONS = {
  enabled: false,
  maxLength: 280,
  pollMs: 15000,
};

const talkQuestionsConfigRepository = createRepository(TALK_QUESTIONS);
