/**
 * Rodadas do sorteio (puro, DUAL, testado em Node em DevFestIA/tools/raffle/). "Resetar" não apaga nada: abre uma
 * rodada nova. Só os sorteios da rodada ATUAL contam (quem já saiu, o número do prêmio e a lista "Já sorteados"); os das
 * rodadas anteriores continuam guardados no banco, só deixam de valer. A rodada atual vive em `raffle-state/current`.
 *
 * O id do documento de cada sorteio carrega a rodada: a mesma pessoa não sai duas vezes NA MESMA rodada (o id já existe) e
 * pode sair de novo na seguinte. A rodada 1 mantém o id de sempre (`<cadastro>_draw`), então os sorteios que já existem
 * (gravados antes de haver rodadas, sem campo `round`) são da rodada 1.
 */
const RAFFLE_FIRST_ROUND = 1;
const RAFFLE_STATE_ID = "current"; // único documento de `raffle-state`

/** Id do documento do sorteio de `entryId` na rodada `round`. ESPELHAR as regras do Firestore (raffle-draws). */
const raffleDrawDocId = (entryId, round) => (round <= RAFFLE_FIRST_ROUND ? `${entryId}_draw` : `${entryId}_r${round}_draw`);

/** Só os sorteios da rodada `round` (sorteio antigo, sem `round`, é da primeira). */
const drawsOfRound = (draws, round) => draws.filter(item => (item.round ?? RAFFLE_FIRST_ROUND) === round);

if (typeof module !== "undefined") module.exports = { RAFFLE_FIRST_ROUND, RAFFLE_STATE_ID, raffleDrawDocId, drawsOfRound };
