/** Página: Patrocínio. Intro/CTA, benefícios, quem já apoia, depoimentos. */
function initPatrocinio() {
  initShell("patrocinio");

  renderPatrocinioIntro(PATROCINIO_INTRO, document.getElementById("patrocinioIntro"));
  renderInfoCards(PATROCINIO_BENEFITS, document.querySelector("#beneficiosSection .faq-grid"));
  renderSponsors(SPONSORS, document.getElementById("sponsorsSection"), document.querySelector(".sponsors-grid"));
  renderTestimonials(TESTIMONIALS, document.getElementById("testimonialsSection"), document.querySelector(".testimonials-grid"));
}

initPatrocinio();
