/**
 * Feature: seção de patrocinadores/parceiros. Some por completo (sem
 * espaço vazio no layout) enquanto SPONSORS estiver vazio ou nenhum
 * tier tiver elementos.
 */
function renderSponsors(sponsors, sectionEl, gridEl) {
  const hasSponsors = sponsors.some(tier => tier.elements.length);
  sectionEl.hidden = !hasSponsors;
  if (!hasSponsors) return;
  gridEl.innerHTML = sponsors.map(sponsorTierMarkup).join("");
}
