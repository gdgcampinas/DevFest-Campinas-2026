/**
 * Feature: comunidades parceiras — reusa sponsorLogoMarkup
 * (components/sponsor-card.js), não duplica o template de logo+link.
 * Some sozinha enquanto vazio.
 */
function renderPartnerCommunities(communities, sectionEl, gridEl) {
  sectionEl.hidden = communities.length === 0;
  if (communities.length === 0) return;
  gridEl.innerHTML = communities.map(sponsorLogoMarkup).join("");
}
