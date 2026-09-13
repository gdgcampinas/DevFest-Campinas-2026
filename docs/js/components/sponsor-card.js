/**
 * Templates de patrocinador/comunidade parceira — sem lógica de quando
 * exibir a seção (isso é feature/sponsors.js e feature/partner-communities.js).
 * `description` é opcional: sem ela, sobra um item simples (logo+nome),
 * usado hoje pelas comunidades parceiras; com ela, vira o card completo
 * (logo em caixa branca + nome + texto), usado pelos patrocinadores.
 * Mesma função pros dois — o "tamanho" do card é decidido só pelo dado.
 */
function sponsorLogoMarkup(sponsor) {
  const widthStyle = sponsor.width ? ` style="width:${sponsor.width}"` : "";
  const description = sponsor.description ? `<p class="sponsor-desc">${sponsor.description}</p>` : "";
  return `
    <a class="sponsor-item" href="${sponsor.link}" target="_blank" rel="noopener" title="${sponsor.name}">
      <div class="sponsor-logo-box"><img src="${sponsor.imageUrl}" alt="${sponsor.name}" loading="lazy"${widthStyle}></div>
      <div class="sponsor-name">${sponsor.name}</div>
      ${description}
    </a>`;
}

/** Um bloco por tier — nome do tier + grid de logos. */
function sponsorTierMarkup(tier) {
  return `
    <div class="sponsor-tier">
      <div class="sponsor-tier-label">${tier.tier}</div>
      <div class="sponsor-logos">${tier.elements.map(sponsorLogoMarkup).join("")}</div>
    </div>`;
}
