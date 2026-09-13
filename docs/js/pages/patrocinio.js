/** Página: Patrocínio. Intro/CTA, benefícios, quem já apoia, depoimentos. */
function initPatrocinio() {
  initShell("patrocinio");

  renderPatrocinioIntro(patrocinioIntroRepository.getAll(), document.getElementById("patrocinioIntro"));
  renderInfoCards(patrocinioBenefitsRepository.getAll(), document.querySelector("#beneficiosSection .faq-grid"));
  renderSponsors(sponsorsRepository.getAll(), document.getElementById("sponsorsSection"), document.querySelector(".sponsors-grid"));
  renderTestimonials(testimonialsRepository.getAll(), document.getElementById("testimonialsSection"), document.querySelector(".testimonials-grid"));
}

initPatrocinio();
