/**
 * Publica o quadro público de UMA palestra a partir do que o moderador está vendo. Sem DOM nem Firebase: tudo entra por
 * parâmetro, então DevFestIA/tools/questions testa o custo de leituras e gravações com repositories falsos. Arquivo "dual".
 *
 *   createBoardPublisher({ talkKey, votes, boards, includeVotes })
 *     votes.countWhere({ entryKey })  conta os votos de uma pergunta (uma consulta agregada, ver firestore-repository.js)
 *     boards.set(talkKey, snapshot)   grava o quadro
 *   publisher.publish(questions)  conta os votos das aprovadas, monta o quadro e SÓ GRAVA se ele mudou desde a última
 *                                 gravação (é isso que poupa as leituras dos celulares); devolve as contagens.
 */
function createBoardPublisher({ talkKey, votes, boards, includeVotes = false }) {
  let lastPublished = null;

  return {
    async publish(questions) {
      const approved = questions.filter(question => question.status === "approved");
      const counts = Object.fromEntries(await Promise.all(approved.map(async question => [question.id, await votes.countWhere({ entryKey: question.id })])));
      const snapshot = buildBoardSnapshot(questions, counts, { includeVotes });
      const serialized = JSON.stringify(snapshot);
      if (serialized !== lastPublished) {
        await boards.set(talkKey, snapshot);
        lastPublished = serialized;
      }
      return counts;
    },
  };
}

/** Assinatura das aprovadas (quais e o texto): mudou = vale publicar já, sem esperar o próximo ciclo. */
const approvedSignature = questions => questions.filter(question => question.status === "approved").map(question => question.id).sort().join("|");

if (typeof module !== "undefined") {
  global.buildBoardSnapshot = require("./board-snapshot.js").buildBoardSnapshot;
  module.exports = { createBoardPublisher, approvedSignature };
}
