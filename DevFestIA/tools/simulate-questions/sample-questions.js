/**
 * Perguntas de EXEMPLO da simulação (só dado). Cada uma vira uma pergunta de uma pessoa diferente (`sim-1`, `sim-2`...), com o estado já definido
 * pra encher as três colunas da tela do moderador: `pending` (esperando), `approved` (no quadro da sala), `answered` e `rejected`.
 */
const SAMPLE_QUESTIONS = [
  { name: "Ana", text: "Qual foi o maior erro que vocês cometeram nesse assunto e o que aprenderam com ele?", status: "pending" },
  { name: "Bruno", text: "Como começar a estudar isso do zero, sem gastar com curso?", status: "pending" },
  { name: "Carla", text: "Isso funciona bem em time pequeno ou só em empresa grande?", status: "pending" },
  { name: "Diego", text: "Quais ferramentas gratuitas vocês recomendam para praticar?", status: "pending" },
  { name: "Elisa", text: "Dá para aplicar no trabalho de hoje ou é só para projeto novo?", status: "approved" },
  { name: "Fábio", text: "Como medir se deu certo depois que a gente adota isso?", status: "approved" },
  { name: "Gabi", text: "Qual conselho você daria para quem está começando agora?", status: "answered" },
  { name: "Hugo", text: "Isso é só modinha ou vai durar?", status: "rejected" },
];

if (typeof module !== "undefined") module.exports = { SAMPLE_QUESTIONS };
