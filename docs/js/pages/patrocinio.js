/** Página: Patrocínio. Intro/CTA, benefícios, quem já apoia, depoimentos. */
function initPatrocinio() {
  const reveal = initShell("patrocinio");

  renderPatrocinioIntro(patrocinioIntroRepository.getAll(), document.getElementById("patrocinioIntro"));
  renderInfoCards(patrocinioBenefitsRepository.getAll(), document.querySelector("#beneficiosSection .faq-grid"));
  renderOrConstruction(reveal, document.getElementById("sponsorsSection"),
    () => renderSponsors(sponsorsRepository.getAll(), document.getElementById("sponsorsSection"), document.querySelector(".sponsors-grid")),
    "Patrocinadores serão revelados em breve.");
  renderTestimonials(testimonialsRepository.getAll(), document.getElementById("testimonialsSection"), document.querySelector(".testimonials-grid"));
}

initPatrocinio();
