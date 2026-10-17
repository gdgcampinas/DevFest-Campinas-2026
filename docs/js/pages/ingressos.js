/** Página: Ingressos. Reusa renderTickets, o mesmo que alimenta a seção da home. */
function initIngressos() {
  const reveal = initShell("ingressos");

  initWaitlist(document.getElementById("waitlist"), { ...defaultWaitlistDeps(), source: "ingressos", openAtStart: location.hash === "#waitlist" });

  const ticketsSection = document.getElementById("ticketsSection");
  if (EVENT.tickets.waitlistOn && !reveal) { // ingressos ainda não abriram e os tipos não foram revelados: aviso bonito em vez da caixa vazia, e sem "gerar cartão" (ninguém tem ingresso ainda)
    ticketsSection.hidden = false;
    ticketsSection.innerHTML = ticketsSoonMarkup({ text: waitlistTextsRepository.getAll(), count: waitlistConfigRepository.getAll().soonCards });
    document.querySelector(".share-card-cta").hidden = true;
  } else {
    renderOrConstruction(reveal, ticketsSection,
      () => renderTickets(EVENT.tickets, ticketsRepository.getAll(), ticketsSection, { note: tt(TICKETS_NOTE) }),
      t("tickets.soon", "Os tipos e valores de ingresso serão revelados em breve."));
  }

  const gate = EVENT.tickets.registrationGate
    ? createRegistrationGate({
        getRegistrations: () => window.registrationsRepository,
        edition: CURRENT_EDITION,
        verifiedRepository: verifiedRegistrationsRepository,
      })
    : null;
  initShareCard(document.body, {
    event: EVENT,
    schedule: SCHEDULE,
    createModal,
    gate,
    ticketButtonHtml: ticketButtonMarkup(ticketCtaState(EVENT.tickets), { className: "chip-btn", place: "share-card-gate" }),
  });
}

initIngressos();
