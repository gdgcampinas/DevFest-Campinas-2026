/** Página: Ingressos. Reusa renderTickets, o mesmo que alimenta a seção da home. */
function initIngressos() {
  initShell("ingressos");

  renderTickets(EVENT.tickets, ticketsRepository.getAll(), document.getElementById("ticketsSection"), { note: TICKETS_NOTE });
}

initIngressos();
