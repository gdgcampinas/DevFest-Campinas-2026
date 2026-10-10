/**
 * Feature: comunidades parceiras — reusa sponsorLogoMarkup
 * (components/sponsor-card.js), não duplica o template de logo+link.
 * Some sozinha enquanto vazio. O logo já traz o nome da comunidade: o nome
 * fica no `alt`/`title` (sem repetir em texto).
 */
function renderPartnerCommunities(communities, sectionEl, gridEl) {
  sectionEl.hidden = communities.length === 0;
  if (communities.length === 0) return;
  gridEl.innerHTML = communities.map(community => sponsorLogoMarkup(community, { showName: false })).join("");
}

/** Monta a seção na página atrás da revelação; antes dela a seção SOME (sem aviso: só aparece o que é real). Home e Patrocínio usam a mesma. */
function initPartnerCommunitiesSection({ reveal, communities, sectionEl, gridEl }) {
  if (!reveal) {
    sectionEl.hidden = true;
    return;
  }
  renderPartnerCommunities(communities, sectionEl, gridEl);
}
