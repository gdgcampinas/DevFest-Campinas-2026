/**
 * Página: Principal. Hero (status ao vivo), números da última
 * edição, destaques, sobre, antes de vir, teasers de Grade/
 * Palestrantes, realização, patrocínio, comunidades, ingressos.
 */
function initHome() {
  const reveal = initShell("principal");
  const wallInvite = defaultWallInvite();
  initWallInviteCard(document.getElementById("wallInvite"), { invite: wallInvite });

  initStickyStatus(document.getElementById("hero"), document.getElementById("stickyStatus"));
  initHeroGalaxy({ mountEl: document.getElementById("heroStage"), config: heroGalaxyRepository.getAll() });

  const modal = createTalkModal();
  const calendar = initCalendarActions(document.body, { schedule: SCHEDULE, tracks: TRACKS, event: EVENT, favorites: favoritesRepository });
  const { feedback, eventFeedback, questions, contest } = initFeedbackFlow({ calendar, reveal, createModal, invite: wallInvite.linkMarkup });
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal, favorites: favoritesRepository, calendar, feedback, questions, contest });
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
  initSponsorsSection({ reveal, tiers: sponsorsRepository.getAll(), sectionEl: document.getElementById("sponsorsSection"), gridEl: document.querySelector(".sponsors-grid"), soonMessage: t("home.sponsorsSoon", "Patrocinadores serão revelados em breve.") });
  initPartnerCommunitiesSection({ reveal, communities: partnerCommunitiesRepository.getAll(), sectionEl: document.getElementById("partnerCommunitiesSection"), gridEl: document.querySelector(".partner-communities-grid"), soonMessage: t("home.communitiesSoon", "Comunidades parceiras serão reveladas em breve.") });

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
