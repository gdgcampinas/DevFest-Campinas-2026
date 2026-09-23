/**
 * Regras puras do sync (sem rede, sem banco): quem conta como inscrito,
 * quais chaves públicas existem e o que mudou desde a última rodada.
 * A chave de cada e-mail vem de docs/js/data/email-hash.js, o MESMO
 * arquivo que o site usa pra consultar, então escrita e leitura nunca divergem.
 */
const { registrationKey } = require("../../../docs/js/data/email-hash.js");

const isApproved = (status, approvedStatuses) => approvedStatuses.includes(String(status).toUpperCase());

/** Participantes de pedidos aprovados: só esses contam como inscrição. */
function approvedParticipants(participants, approvedStatuses) {
  return participants.filter(participant => isApproved(participant.orderStatus, approvedStatuses));
}

/**
 * Mapa "chave pública -> tipo de ingresso". Cada participante entra pelo
 * próprio e-mail e pelo e-mail de quem comprou o pedido (quando diferente).
 * O e-mail do participante tem prioridade se os dois colidirem.
 */
async function buildDesiredRegistrations({ participants, orders, edition, approvedStatuses }) {
  const buyerByOrder = new Map(orders.filter(order => isApproved(order.status, approvedStatuses)).map(order => [order.id, order.buyerEmail]));
  const desired = new Map();
  const add = async (email, ticketName, overwrite) => {
    if (!email) return;
    const key = await registrationKey(edition, email);
    if (overwrite || !desired.has(key)) desired.set(key, ticketName);
  };
  for (const participant of approvedParticipants(participants, approvedStatuses)) {
    await add(buyerByOrder.get(participant.orderId), participant.ticketName, false);
    await add(participant.email, participant.ticketName, true);
  }
  return desired;
}

/** O que gravar e apagar pra sair do estado anterior ({ chave: ticket }) e chegar no desejado. */
function diffRegistrations(previous, desired) {
  const upserts = [...desired].filter(([key, ticketName]) => previous[key] !== ticketName);
  const deletes = Object.keys(previous).filter(key => !desired.has(key));
  return { upserts, deletes };
}

const tally = (items, keyFn) => items.reduce((acc, item) => ({ ...acc, [keyFn(item)]: (acc[keyFn(item)] ?? 0) + 1 }), {});

/** Números do painel privado (só no resumo do job, nunca no Firestore público). */
function buildStats(participants, approvedStatuses) {
  const approved = approvedParticipants(participants, approvedStatuses);
  const formAnswers = approved.flatMap(participant => participant.customForm ?? []);
  return {
    total: approved.length,
    byTicket: tally(approved, participant => participant.ticketName || "(sem nome)"),
    checkedIn: approved.filter(participant => participant.checkedIn).length,
    notApproved: participants.length - approved.length,
    formAnswers: tally(formAnswers, answer => `${answer.name}: ${answer.value}`),
  };
}

module.exports = { approvedParticipants, buildDesiredRegistrations, diffRegistrations, buildStats };
