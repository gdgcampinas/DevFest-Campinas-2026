/** Página: Ingressos. Reusa renderTickets, o mesmo que alimenta a seção da home. */
function initIngressos() {
  const reveal = initShell("ingressos");

  initWaitlist(document.getElementById("waitlist"), { ...defaultWaitlistDeps(), source: "ingressos", openAtStart: location.hash === "#waitlist" });

  const tshirtDeps = { models: tshirtsRepository.getAll(), text: tshirtTextsRepository.getAll() };
  const sizesText = tshirtSizesTextsRepository.getAll();
  const sizesShown = initTshirtSizes(document.getElementById("tamanhos"), { models: tshirtSizesRepository.getAll(), text: sizesText, config: tshirtSizesConfigRepository.getAll(), devMode: isDevModeStored() });
  const sizesLinkHtml = sizesShown ? tshirtSizesLinkMarkup(sizesText) : ""; // o atalho só existe com o guia visível
  const showcases = { tshirt: () => tshirtShowcaseMarkup(tshirtDeps) + sizesLinkHtml }; // vitrine extra por tipo de ingresso (`showcase` em data/tickets.js)
  initTshirtGallery(document.body, { createModal, ...tshirtDeps, sizesLinkHtml });

  document.getElementById("ticketsHero").innerHTML = ticketsHeroMarkup({ text: ticketsHeroTextsRepository.getAll(), open: EVENT.tickets.salesOpen });

  const ticketsSection = document.getElementById("ticketsSection");
  if (EVENT.tickets.waitlistOn && !reveal) { // ingressos ainda não abriram e os tipos não foram revelados: aviso bonito em vez da caixa vazia, e sem "gerar cartão" (ninguém tem ingresso ainda)
    ticketsSection.hidden = false;
    ticketsSection.innerHTML = ticketsSoonMarkup({ text: waitlistTextsRepository.getAll(), count: waitlistConfigRepository.getAll().soonCards });
    document.querySelector(".share-card-cta").hidden = true;
  } else {
    renderOrConstruction(reveal || EVENT.tickets.salesOpen, ticketsSection,
      () => renderTickets(EVENT.tickets, ticketsRepository.getAll(), ticketsSection, { note: tt(TICKETS_NOTE), showcase: type => showcases[type.showcase]?.() ?? "" }),
      t("tickets.soon", "Os tipos e valores de ingresso serão revelados em breve."));
  }

  const syncConfig = registrationSyncConfigRepository.getAll();
  const gate = registrationGateOn(EVENT.tickets, { devMode: isDevModeStored() })
    ? createRegistrationGate({
        getRegistrations: () => window.registrationsRepository,
        edition: CURRENT_EDITION,
        verifiedRepository: verifiedRegistrationsRepository,
        sync: createRegistrationSync({ syncUrl: syncConfig.url, waitMs: syncConfig.waitMs, pollMs: syncConfig.pollMs }),
      })
    : null;
  initShareCard(document.body, {
    event: EVENT,
    createModal,
    gate,
    ticketButtonHtml: ticketButtonMarkup(ticketCtaState(EVENT.tickets), { className: "chip-btn", place: "share-card-gate" }),
  });
}

initIngressos();
