/**
 * Frases prontas da tela do moderador do mural (mural-controle.html): um toque preenche o campo e o moderador ajusta antes de publicar. Só texto, sem lógica:
 *   notice     avisos comuns do dia ("a próxima palestra começa em 5 minutos", achado e perdido...)
 *   emergency  textos de emergência (evacuação, atraso grande); o moderador sempre pode escrever o seu
 *   kinds      como cada TIPO de aviso aparece na tela do moderador (os ids são os de MURAL_CONFIG.control.kinds): `label` do botão, `durationLabel` (o que o tempo significa) e `placeholder`
 *   announce   avisos ao vivo prontos (um toque escolhe o tipo e preenche o texto; o moderador só escolhe o tempo e publica): foto da galera, sorteio, pausa
 * O limite de caracteres é o de MURAL_CONFIG.control (as regras do Firestore usam o mesmo).
 */
const MURAL_NOTICE_TEMPLATES = {
  notice: [
    "A próxima palestra começa em 5 minutos",
    "Achado e perdido: procure a equipe da organização",
    "O almoço está sendo servido",
    "Última chamada para o sorteio",
  ],
  kinds: {
    info: { label: "Aviso", durationLabel: "Fica no ar:", placeholder: "Escreva o aviso" },
    alert: { label: "Alerta", durationLabel: "Fica no ar:", placeholder: "Escreva o alerta" },
    quote: { label: "Frase", durationLabel: "Fica no ar:", placeholder: "A frase marcante da palestra (aparece com aspas grandes)" },
    countdown: { label: "Contagem", durationLabel: "Acontece em:", placeholder: "O que vai acontecer (ex.: Foto da galera)" },
    break: { label: "Pausa", durationLabel: "A pausa dura:", placeholder: "Ex.: Pausa para o café (liga as perguntas de quebra-gelo)" },
  },
  announce: [
    { label: "Foto da galera", kind: "countdown", text: "Foto da galera: venham para perto" },
    { label: "Sorteio", kind: "countdown", text: "Sorteio: fique perto do palco" },
    { label: "Pausa para o café", kind: "break", text: "Pausa para o café" },
  ],
  emergency: [
    "Evacuação: sigam as saídas de emergência com calma",
    "Interrupção temporária: aguardem as instruções da organização",
  ],
};

const muralNoticeTemplatesRepository = createRepository(MURAL_NOTICE_TEMPLATES);
