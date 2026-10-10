/**
 * Feature: seção de patrocinadores/parceiros. Some por completo (sem
 * espaço vazio no layout) enquanto SPONSORS estiver vazio ou nenhum
 * tier tiver elementos.
 *
 * Antes da revelação geral (`reveal` falso) só aparecem as marcas
 * `public: true` (confirmadas e liberadas, ex.: o Master); sem nenhuma, vale
 * o aviso "em breve". Depois da revelação (ou em DEV) aparece tudo.
 */
function renderSponsors(sponsors, sectionEl, gridEl) {
  const hasSponsors = sponsors.some(tier => tier.elements.length);
  sectionEl.hidden = !hasSponsors;
  if (!hasSponsors) return;
  gridEl.innerHTML = sponsors.map(sponsorTierMarkup).join("");
}

/** Só as marcas liberadas (`public`); cota que ficou vazia sai da lista. */
function publicSponsorTiers(tiers) {
  return tiers
    .map(tier => ({ ...tier, elements: tier.elements.filter(element => element.public) }))
    .filter(tier => tier.elements.length);
}

/** Monta a seção na página: tudo depois da revelação, só as liberadas antes dela, aviso "em breve" se não houver nenhuma. */
function initSponsorsSection({ reveal, tiers, sectionEl, gridEl, soonMessage }) {
  const visible = reveal ? tiers : publicSponsorTiers(tiers);
  if (reveal || visible.length) return renderSponsors(visible, sectionEl, gridEl);
  renderOrConstruction(false, sectionEl, () => {}, soonMessage);
}

if (typeof module !== "undefined") module.exports = { publicSponsorTiers };
