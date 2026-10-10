/** Página: Patrocínio. Intro/CTA, benefícios, quem já apoia, comunidades parceiras, depoimentos, realização. */
function initPatrocinio() {
  const reveal = initShell("patrocinio");

  renderPatrocinioIntro(patrocinioIntroRepository.getAll(), document.getElementById("patrocinioIntro"));
  renderSponsorshipBanner(sponsorshipBannerRepository.getAll(), document.getElementById("sponsorshipBanner"));
  renderInfoCards(patrocinioBenefitsRepository.getAll(), document.querySelector("#beneficiosSection .faq-grid"));
  initSponsorsSection({ reveal, tiers: sponsorsRepository.getAll(), sectionEl: document.getElementById("sponsorsSection"), gridEl: document.querySelector(".sponsors-grid"), soonMessage: t("home.sponsorsSoon", "Patrocinadores serão revelados em breve.") });
  initPartnerCommunitiesSection({ reveal, communities: partnerCommunitiesRepository.getAll(), sectionEl: document.getElementById("partnerCommunitiesSection"), gridEl: document.querySelector(".partner-communities-grid") });
  renderTestimonials(testimonialsRepository.getAll(), document.getElementById("testimonialsSection"), document.querySelector(".testimonials-grid"));
  renderRealizacao(EVENT.hosts, document.querySelector(".realizacao-grid"), { by: REALIZATION_BY });
}

initPatrocinio();
