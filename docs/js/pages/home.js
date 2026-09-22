/**
 * Página: Principal. Hero (status ao vivo), números da última
 * edição, destaques, sobre, antes de vir, teasers de Grade/
 * Palestrantes, realização, patrocínio, comunidades, ingressos.
 */
function initHome() {
  const reveal = initShell("principal");

  initStickyStatus(document.getElementById("hero"), document.getElementById("stickyStatus"));

  const modal = createTalkModal();
  const calendar = initCalendarActions(document.body, { schedule: SCHEDULE, tracks: TRACKS, event: EVENT, favorites: favoritesRepository });
  const feedback = initTalkFeedback(document.body, { index: calendar.index, reveal, now: resolveNow() });
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal, favorites: favoritesRepository, calendar, feedback });
  initFavorites(document.body, favoritesRepository);

  renderStats(statsRepository.getAll(), document.getElementById("statsSection"), document.querySelector(".stats-grid"));
  renderVideo(videoRepository.getAll(), document.getElementById("videoSection"), document.querySelector(".video-embed"));
  initFeaturedSpeakers(extractSpeakers(SCHEDULE, TRACKS, EVENT.timezone), document.getElementById("featuredSpeakersSection"), document.querySelector(".featured-speakers-grid"), { count: 4, intervalMs: 15000, reveal });
  renderHighlights(highlightsRepository.getAll(), document.getElementById("highlightsSection"), document.querySelector(".highlights-grid"), modal);
  renderAbout(aboutRepository.getAll(), document.getElementById("aboutSection"));
  initMenuCarousel(modal.el);

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

  const liveStatus = createLiveStatus({
    schedule: SCHEDULE,
    tracks: TRACKS,
    event: EVENT,
    reveal,
    favorites: favoritesRepository,
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
