/**
 * Templates de patrocinador — sem lógica de quando exibir a seção
 * (isso é feature/sponsors.js). Puramente cor-por-parâmetro/dado.
 */
function sponsorLogoMarkup(sponsor) {
  const widthStyle = sponsor.width ? ` style="width:${sponsor.width}"` : "";
  return `
    <a class="sponsor-logo" href="${sponsor.link}" target="_blank" rel="noopener" title="${sponsor.name}">
      <img src="${sponsor.imageUrl}" alt="${sponsor.name}" loading="lazy"${widthStyle}>
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
