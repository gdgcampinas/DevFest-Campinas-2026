/**
 * O quadro público de uma palestra: as perguntas aprovadas na ordem em que a plateia e a sala devem ver. Função pura
 * (sem DOM nem Firebase), arquivo "dual" (navegador e Node) testado em DevFestIA/tools/questions.
 *
 * `buildBoardSnapshot(questions, counts, { includeVotes })` devolve `{ questions: [{ id, text, name, votes? }] }`, só as
 * aprovadas, mais votadas primeiro (empate: a mais antiga). O número de votos só entra no quadro com `includeVotes`
 * (config `publishVotes`): sem ele o quadro só muda quando a ORDEM muda, e cada mudança custa uma leitura pra cada
 * celular que está olhando, então isso é o que faz o plano grátis do Firestore render (o moderador vê os números pela
 * contagem dele, que não vai pro quadro).
 */
function buildBoardSnapshot(questions, counts, { includeVotes = false } = {}) {
  return {
    questions: rankQuestions(questions, counts).map(({ id, text, name, votes }) => (includeVotes ? { id, text, name, votes } : { id, text, name })),
  };
}

if (typeof module !== "undefined") {
  const { rankQuestions } = require("./question-ranking.js");
  global.rankQuestions = rankQuestions; // o navegador tem essa função global; no Node, o arquivo "dual" a pega daqui
  module.exports = { buildBoardSnapshot };
}
