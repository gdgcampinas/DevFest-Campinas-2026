/**
 * Templates de patrocinador/comunidade parceira — sem lógica de quando
 * exibir a seção (isso é feature/sponsors.js e feature/partner-communities.js).
 * `description` é opcional: sem ela, sobra um item simples (logo+nome),
 * usado hoje pelas comunidades parceiras; com ela, vira o card completo
 * (logo em caixa branca + nome + texto), usado pelos patrocinadores.
 * Mesma função pros dois — o "tamanho" do card é decidido só pelo dado.
 * O logo já traz o nome da marca: o nome em TEXTO só aparece quando o card não mostra descrição (item simples); com descrição o nome
 * fica no `alt`/`title` do logo (sem repetir); `showName` força um ou outro (comunidades: só o logo). `sponsorTierStyle` (data/sponsor-tiers.js) diz o layout e se a cota mostra a descrição.
 */
function sponsorLogoMarkup(sponsor, { showDescription = true, showName } = {}) {
  const widthStyle = sponsor.width ? ` style="width:${sponsor.width}"` : "";
  const hasDescription = showDescription && Boolean(sponsor.description);
  const description = hasDescription ? `<p class="sponsor-desc">${sponsor.description}</p>` : "";
  const name = (showName ?? !hasDescription) ? `<div class="sponsor-name">${sponsor.name}</div>` : "";
  return `
    <a class="sponsor-item" href="${sponsor.link}" target="_blank" rel="noopener" title="${sponsor.name}" data-track-event="sponsor_click" data-track-target="${sponsor.name}">
      <div class="sponsor-logo-box${sponsor.logoTone === "dark" ? " sponsor-logo-box--dark" : ""}"><img src="${sponsor.imageUrl}" alt="${sponsor.name}" loading="lazy"${widthStyle}></div>
      ${name}
      ${description}
    </a>`;
}

/** Um bloco por cota: nome da cota + grid de logos. O `data-tier` leva a cota pro CSS (layout e cor); a descrição segue o estilo da cota. */
function sponsorTierMarkup(tier) {
  const style = sponsorTierStyle(tier.tier);
  return `
    <div class="sponsor-tier" data-tier="${style.slug}">
      <div class="sponsor-tier-label">${tier.tier}</div>
      <div class="sponsor-logos">${tier.elements.map(element => sponsorLogoMarkup(element, { showDescription: style.description })).join("")}</div>
    </div>`;
}
