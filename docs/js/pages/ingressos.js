/** Página: Ingressos. Reusa renderTickets, o mesmo que alimenta a seção da home. */
function initIngressos() {
  const reveal = initShell("ingressos");

  renderOrConstruction(reveal, document.getElementById("ticketsSection"),
    () => renderTickets(EVENT.tickets, ticketsRepository.getAll(), document.getElementById("ticketsSection"), { note: TICKETS_NOTE }),
    "Os tipos e valores de ingresso serão revelados em breve.");

  initShareCard(document.body, { event: EVENT, schedule: SCHEDULE, createModal });
}

initIngressos();
