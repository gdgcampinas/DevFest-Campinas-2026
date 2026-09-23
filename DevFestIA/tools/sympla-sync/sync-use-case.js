/**
 * Caso de uso do sync: lê o Sympla, calcula o que mudou e grava só a
 * diferença. Depende de duas fronteiras injetadas (nada de rede/banco aqui):
 *   symplaRepository → listParticipants / listOrders
 *   database         → getDocument / commit  (ver ../lib/firestore-rest.js)
 *
 * Estado anterior = 1 documento (`sync-state`, um JSON), então cada rodada
 * custa 1 leitura + só as escritas do que mudou, longe do limite grátis.
 * Idempotente: se cair no meio, a próxima rodada refaz a diferença.
 */
const { buildDesiredRegistrations, diffRegistrations, buildStats } = require("./reconcile.js");

const REGISTRATIONS = "registrations";
const PUBLIC_STATS = "event-stats";
const SYNC_STATE = "sync-state";

async function runSync({ symplaRepository, database, edition, approvedStatuses = ["APPROVED"], dryRun = false }) {
  const [participants, orders, previousDoc, previousStats] = await Promise.all([
    symplaRepository.listParticipants(),
    symplaRepository.listOrders(),
    database.getDocument(SYNC_STATE, edition),
    database.getDocument(PUBLIC_STATS, edition),
  ]);

  const previous = previousDoc?.stateJson ? JSON.parse(previousDoc.stateJson) : {};
  const desired = await buildDesiredRegistrations({ participants, orders, edition, approvedStatuses });
  const { upserts, deletes } = diffRegistrations(previous, desired);
  const stats = buildStats(participants, approvedStatuses);

  const writes = [
    ...upserts.map(([key, ticketName]) => ({ set: [REGISTRATIONS, key, { edition, ticketName }] })),
    ...deletes.map(key => ({ remove: [REGISTRATIONS, key] })),
  ];
  if (previousStats?.total !== stats.total) writes.push({ set: [PUBLIC_STATS, edition, { edition, total: stats.total }] });
  // o estado só é salvo depois das gravações acima: se falhar antes, a próxima rodada repete a diferença
  const stateChanged = upserts.length > 0 || deletes.length > 0;

  if (!dryRun && writes.length > 0) await database.commit(writes);
  if (!dryRun && stateChanged) await database.commit([{ set: [SYNC_STATE, edition, { stateJson: JSON.stringify(Object.fromEntries(desired)) }] }]);

  return { stats, upserted: upserts.length, deleted: deletes.length, registrations: desired.size, dryRun };
}

module.exports = { runSync, REGISTRATIONS, PUBLIC_STATS, SYNC_STATE };
