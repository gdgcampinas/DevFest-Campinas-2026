/**
 * Frases prontas da tela do moderador do mural (mural-controle.html): um toque preenche o campo e o moderador ajusta antes de publicar. Só texto, sem lógica:
 *   notice     avisos comuns do dia ("a próxima palestra começa em 5 minutos", achado e perdido...)
 *   emergency  textos de emergência (evacuação, atraso grande); o moderador sempre pode escrever o seu
 * O limite de caracteres é o de MURAL_CONFIG.control (as regras do Firestore usam o mesmo).
 */
const MURAL_NOTICE_TEMPLATES = {
  notice: [
    "A próxima palestra começa em 5 minutos",
    "Achado e perdido: procure a equipe da organização",
    "O almoço está sendo servido",
    "Última chamada para o sorteio",
  ],
  emergency: [
    "Evacuação: sigam as saídas de emergência com calma",
    "Interrupção temporária: aguardem as instruções da organização",
  ],
};

const muralNoticeTemplatesRepository = createRepository(MURAL_NOTICE_TEMPLATES);
