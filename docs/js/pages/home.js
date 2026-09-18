/**
 * Página: Principal. Hero (status ao vivo), números da última
 * edição, destaques, sobre, antes de vir, teasers de Grade/
 * Palestrantes, realização, patrocínio, comunidades, ingressos.
 */
function initHome() {
  const reveal = initShell("principal");

  initStickyStatus(document.getElementById("hero"), document.getElementById("stickyStatus"));

  const modal = createTalkModal(document.getElementById("talkModal"), document.getElementById("talkModalContent"));
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal });

  renderStats(statsRepository.getAll(), document.getElementById("statsSection"), document.querySelector(".stats-grid"));
  renderVideo(videoRepository.getAll(), document.getElementById("videoSection"), document.querySelector(".video-embed"));
  initFeaturedSpeakers(mockSpeakersRepository.getAll(), document.getElementById("featuredSpeakersSection"), document.querySelector(".featured-speakers-grid"), { count: 4, intervalMs: 15000 });
  renderHighlights(highlightsRepository.getAll(), document.getElementById("highlightsSection"), document.querySelector(".highlights-grid"), modal);
  renderAbout(aboutRepository.getAll(), document.getElementById("aboutSection"));
  initMenuCarousel(document.getElementById("talkModal"));

  renderInfoCards(buildBeforeYouComeItems(TRACKS), document.getElementById("beforeYouCome"));
  renderVenueInfo(EVENT, document.getElementById("venueInfo"), SCHEDULE);
  renderVenueMap(EVENT, document.getElementById("venueMap"));
  initClickableCard(document.querySelector('[data-item="parking"]'), modal, () =>
    galleryMarkup("Estacionamento", "Informações em breve.", PARKING_IMAGES));
  initClickableCard(document.querySelector('[data-item="food"]'), modal, () =>
    galleryMarkup("Cardápio", "Informações em breve.", FOOD_IMAGES));
  renderTracksOverview(TRACKS, document.getElementById("tracksOverviewSection"), document.querySelector(".tracks-overview-grid"));

  renderRealizacao(EVENT.hosts, document.querySelector(".realizacao-grid"));
  renderTestimonials(testimonialsRepository.getAll(), document.getElementById("testimonialsSection"), document.querySelector(".testimonials-grid"));
  renderSponsors(sponsorsRepository.getAll(), document.getElementById("sponsorsSection"), document.querySelector(".sponsors-grid"));
  renderPartnerCommunities(partnerCommunitiesRepository.getAll(), document.getElementById("partnerCommunitiesSection"), document.querySelector(".partner-communities-grid"));
  renderTickets(EVENT.tickets, document.getElementById("ticketsAction"));

  const liveStatus = createLiveStatus({
    schedule: SCHEDULE,
    tracks: TRACKS,
    event: EVENT,
    reveal,
    elements: {
      statusPill: document.getElementById("statusPill"),
      hero: document.getElementById("hero"),
      stickyTxt: document.getElementById("stickyTxt"),
      stickyPulse: document.getElementById("stickyPulse"),
    },
    now: resolveNow(),
  });

  liveStatus.tick();
  setInterval(liveStatus.tick, 1000);
}

initHome();
