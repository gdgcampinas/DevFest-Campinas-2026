/**
 * Perguntas ao vivo por palestra: configuração. `enabled` é a chave geral
 * (só ligar depois que as regras do Firestore de "talk-questions" e "talk-question-votes"
 * estiverem publicadas, ver DevFestIA/firebase/firestore.rules).
 *   enforceWindow trava de horário: false = pergunta, voto e check-in a qualquer hora (teste em DEV); true = só durante a palestra (check-in: janela abaixo).
 *                 LIGADA em 2026-11-20 (o line-up real é público). LIGAR ANTES DO EVENTO, junto com `windowEnforced()` das regras do Firestore (um teste confere que são iguais).
 *   checkinLeadMinutes / checkinTailMinutes  janela do check-in (só com a trava ligada): abre N minutos antes do início da palestra e fecha N minutos depois do fim
 *                 (600 = o resto do dia). ESPELHAM `checkinLeadMinutes()` e `checkinTailMinutes()` das regras do Firestore (um teste confere).
 *   maxLength     tamanho máximo do texto (espelhar a regra do Firestore)
 *   maxPerPerson  perguntas por pessoa por palestra (espelhar as regras: entryKey "#1" a "#N")
 *   pollMs           de quanto em quanto tempo o modal confere se ainda está aberto e redesenha o que chegou (não lê nada do banco)
 *   mineRefreshMs    de quanto em quanto tempo relê as PRÓPRIAS perguntas, só enquanto alguma ainda espera o moderador
 *   boardPublishMs   de quanto em quanto tempo a tela do moderador recontar os votos e ver se a ordem mudou (cada contagem custa
 *                    leituras; o quadro só é regravado, e só custa leitura pra plateia, quando a ordem muda)
 *   publishVotes     true = o quadro público traz o número de votos (regrava a cada voto novo: mais leituras); false = só a ordem
 */
/**
 * Estados de uma pergunta (campo `status`, o mesmo das regras do Firestore): nasce "pending"; o moderador aprova
 * ("approved": aparece pra plateia e no quadro da sala), rejeita ("rejected") ou marca como respondida ("answered").
 */
const QUESTION_STATUS = Object.freeze({ pending: "pending", approved: "approved", answered: "answered", rejected: "rejected" });

const TALK_QUESTIONS = {
  enabled: true,
  enforceWindow: true,
  checkinLeadMinutes: 10,
  checkinTailMinutes: 600,
  maxLength: 280,
  maxPerPerson: 3,
  pollMs: 15000,
  mineRefreshMs: 60000,
  boardPublishMs: 60000,
  publishVotes: false,
};

const talkQuestionsConfigRepository = createRepository(TALK_QUESTIONS);
