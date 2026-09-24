/**
 * Página: Principal. Hero (status ao vivo), números da última
 * edição, destaques, sobre, antes de vir, teasers de Grade/
 * Palestrantes, realização, patrocínio, comunidades, ingressos.
 */
function initHome() {
  const reveal = initShell("principal");

  initStickyStatus(document.getElementById("hero"), document.getElementById("stickyStatus"));
  initHeroGalaxy({ mountEl: document.getElementById("heroStage"), config: heroGalaxyRepository.getAll() });

  const modal = createTalkModal();
  const calendar = initCalendarActions(document.body, { schedule: SCHEDULE, tracks: TRACKS, event: EVENT, favorites: favoritesRepository });
  const { feedback, eventFeedback, questions } = initFeedbackFlow({ calendar, reveal, createModal });
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal, favorites: favoritesRepository, calendar, feedback, questions });
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
    galleryMarkup(t("before.parking", "Estacionamento"), t("before.infoSoon", "Informações em breve."), PARKING_IMAGES));
  initClickableCard(document.querySelector('[data-item="food"]'), modal, () =>
    galleryMarkup(t("before.menu", "Cardápio"), t("before.infoSoon", "Informações em breve."), FOOD_IMAGES));
  renderTracksOverview(TRACKS, document.getElementById("tracksOverviewSection"), document.querySelector(".tracks-overview-grid"));

  renderRealizacao(EVENT.hosts, document.querySelector(".realizacao-grid"));
  renderTestimonials(testimonialsRepository.getAll(), document.getElementById("testimonialsSection"), document.querySelector(".testimonials-grid"));
  renderOrConstruction(reveal, document.getElementById("sponsorsSection"),
    () => renderSponsors(sponsorsRepository.getAll(), document.getElementById("sponsorsSection"), document.querySelector(".sponsors-grid")),
    t("home.sponsorsSoon", "Patrocinadores serão revelados em breve."));
  renderOrConstruction(reveal, document.getElementById("partnerCommunitiesSection"),
    () => renderPartnerCommunities(partnerCommunitiesRepository.getAll(), document.getElementById("partnerCommunitiesSection"), document.querySelector(".partner-communities-grid")),
    t("home.communitiesSoon", "Comunidades parceiras serão reveladas em breve."));

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
    onEventEnd: containerEl => eventFeedback.render(containerEl),
  });

  liveStatus.tick();
  setInterval(liveStatus.tick, 1000);
}

initHome();
