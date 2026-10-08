/**
 * Cena de patrocinadores: as cotas pedidas em `params.tiers` (uma cota por cena = tempo de tela por cota, decidido em data/mural-scenes.js).
 * O logo já traz o nome; logo que não carrega vira só o nome em texto. Cota sem ninguém não gera cena (MURAL_SKIP). Tudo injetado: `repository` (data/sponsors.js), `preload`.
 */
function createSponsorsScene({ repository, preload }) {
  const isInline = url => !url || url.startsWith("data:");
  const withLogoStatus = async sponsor => ({ ...sponsor, logoOk: isInline(sponsor.imageUrl) ? Boolean(sponsor.imageUrl) : await preload(sponsor.imageUrl).then(() => true, () => false) });
  return {
    async prepare(params) {
      const tiers = repository.getAll().filter(tier => params.tiers.includes(tier.tier) && tier.elements.length);
      if (!tiers.length) return MURAL_SKIP;
      return Promise.all(tiers.map(async tier => ({ tier: tier.tier, elements: await Promise.all(tier.elements.map(withLogoStatus)) })));
    },
    render(tiers, params) {
      const groups = tiers.map(({ tier, elements }) => `
        <div class="ms-tier" data-count="${elements.length}">
          <h3 class="ms-tier-name">${escapeHtml(tier)}</h3>
          <ul class="ms-sponsors">${elements.map((sponsor, index) => `<li class="ms-sponsor ms-stagger"${muralStagger(index)}>${sponsor.logoOk ? `<img src="${escapeHtml(sponsor.imageUrl)}" alt="${escapeHtml(sponsor.name)}">` : `<span>${escapeHtml(sponsor.name)}</span>`}</li>`).join("")}</ul>
        </div>`).join("");
      return { markup: `<section class="ms ms-sponsors-scene">${muralHeadMarkup({ kicker: "Patrocínio", title: params.title })}<div class="ms-tiers">${groups}</div></section>` };
    },
  };
}
