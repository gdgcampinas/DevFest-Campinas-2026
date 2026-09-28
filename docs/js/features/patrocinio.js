/** Feature: hero/CTA da página Patrocínio. */
function renderPatrocinioIntro(intro, mountEl) {
  mountEl.innerHTML = `
    <h1>${intro.title}</h1>
    <p class="patrocinio-subtitle">${intro.subtitle}</p>
    <a class="featured-speakers-cta patrocinio-cta" href="${intro.ctaLink}">${intro.ctaLabel}</a>`;
}

/** Banner de divulgação (data/patrocinio.js, sponsorshipBannerRepository). */
function renderSponsorshipBanner(banner, mountEl) {
  if (!mountEl) return;
  mountEl.innerHTML = `<img src="${banner.file}" alt="${escapeHtml(banner.alt)}" loading="lazy" width="1122" height="1402">`;
}
