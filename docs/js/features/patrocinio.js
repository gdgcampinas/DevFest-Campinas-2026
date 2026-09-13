/** Feature: hero/CTA da página Patrocínio. */
function renderPatrocinioIntro(intro, mountEl) {
  mountEl.innerHTML = `
    <h1>${intro.title}</h1>
    <p class="patrocinio-subtitle">${intro.subtitle}</p>
    <a class="featured-speakers-cta patrocinio-cta" href="${intro.ctaLink}">${intro.ctaLabel}</a>`;
}
