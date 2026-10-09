/** As frases da página de enviar recado (recado.html): só texto, sem lógica. Os limites vêm de data/wall-config.js.
 * `{from}` e `{until}` viram a hora de abrir e fechar (data/wall-config.js `window`, no fuso do evento).
 * invite* = o cartão da home e o convite depois da avaliação ("Recados no telão").
 */
const WALL_TEXTS = {
  title: "Seu recado no telão",
  intro: "Escreva em uma frase. Depois que a equipe aprovar, ele aparece no telão do DevFest.",
  promptLegend: "Escolha uma pergunta",
  textLabel: "Seu recado",
  nicknameLabel: "Apelido (opcional)",
  privacy: "O recado aparece no telão para todo mundo. Não coloque dados pessoais, links nem telefone.",
  send: "Enviar pro telão",
  loading: "Carregando…",
  before: "Os recados abrem no dia do evento, das {from} às {until}. Volte aqui e deixe o seu!",
  closed: "Os recados estão encerrados. Obrigado por participar!",
  limit: "Você já mandou todos os seus recados. Obrigado, a galera vai adorar ver!",
  sent: "Recebemos! Depois da aprovação da equipe ele aparece no telão.",
  again: "Mandar outro recado",
  noMore: "Esse foi o seu último recado. Obrigado por fazer parte!",
  failed: "Não consegui enviar agora. Tente de novo em instantes.",
  inviteTitle: "Recados no telão",
  inviteText: "Escreva uma frase e veja ela na tela do evento. A galera vai ler!",
  inviteButton: "Deixar meu recado",
  inviteAfterFeedback: "Quer deixar um recado para o telão?",
};

const wallTextsRepository = createRepository(WALL_TEXTS);
