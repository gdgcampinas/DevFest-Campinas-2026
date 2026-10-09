/** As frases da página de enviar recado (recado.html): só texto, sem lógica. Os limites vêm de data/wall-config.js. */
const WALL_TEXTS = {
  title: "Seu recado no telão",
  intro: "Escreva em uma frase. Depois que a equipe aprovar, ele aparece no telão do DevFest.",
  promptLegend: "Escolha uma pergunta",
  textLabel: "Seu recado",
  nicknameLabel: "Apelido (opcional)",
  privacy: "O recado aparece no telão para todo mundo. Não coloque dados pessoais, links nem telefone.",
  send: "Enviar pro telão",
  loading: "Carregando…",
  closed: "Os recados estão encerrados por enquanto. Obrigado por participar!",
  limit: "Você já mandou todos os seus recados. Obrigado, a galera vai adorar ver!",
  sent: "Recebemos! Depois da aprovação da equipe ele aparece no telão.",
  again: "Mandar outro recado",
  noMore: "Esse foi o seu último recado. Obrigado por fazer parte!",
  failed: "Não consegui enviar agora. Tente de novo em instantes.",
};

const wallTextsRepository = createRepository(WALL_TEXTS);
