/**
 * Componente: a vitrine da camiseta no card do ingresso e a galeria (modelos x frente/costas). Só marcação, tudo por parâmetro: `models` (data/tshirts.js), `text` (TSHIRT_TEXTS), `view` ({ modelId, side }).
 * Texto sempre escapado; os hooks são `data-tshirt-open`, `data-tshirt-model` e `data-tshirt-side`, que features/tshirt-gallery.js ouve.
 */
const tshirtAlt = (text, model, side) => `${text.photoOf}: ${model.label}, ${text.sides[side]}`;

/** Botão do card do ingresso: as 3 camisetas (frente) lado a lado e o convite pra ver de perto. */
function tshirtShowcaseMarkup({ models, text }) {
  const images = models.map(model => `<img src="${escapeHtml(model.thumbs.frente)}" alt="${escapeHtml(tshirtAlt(text, model, "frente"))}" loading="lazy" decoding="async">`).join("");
  return `
    <button type="button" class="tshirt-showcase" data-tshirt-open aria-label="${escapeHtml(text.showcaseLabel)}">
      <span class="tshirt-showcase-imgs">${images}</span>
      <span class="tshirt-showcase-cta">${escapeHtml(text.showcaseButton)}</span>
    </button>`;
}

/** Conteúdo do modal: abas dos modelos, a foto grande e o alternador frente/costas. */
function tshirtGalleryMarkup({ models, text, view }) {
  const model = models.find(item => item.id === view.modelId) ?? models[0];
  const tabs = models.map(item => `<button type="button" class="chip-btn${item.id === model.id ? " chip-btn--primary" : ""}" data-tshirt-model="${escapeHtml(item.id)}" aria-pressed="${item.id === model.id}">${escapeHtml(item.label)}</button>`).join("");
  const sides = Object.keys(text.sides).map(side => `<button type="button" class="chip-btn${side === view.side ? " chip-btn--primary" : ""}" data-tshirt-side="${escapeHtml(side)}" aria-pressed="${side === view.side}">${escapeHtml(text.sides[side])}</button>`).join("");
  return `
    <div class="tshirt-gallery">
      <h3 class="tshirt-title">${escapeHtml(text.galleryTitle)}</h3>
      <div class="tshirt-tabs" role="group">${tabs}</div>
      <div class="tshirt-stage"><img src="${escapeHtml(model.images[view.side])}" alt="${escapeHtml(tshirtAlt(text, model, view.side))}" decoding="async"></div>
      <div class="tshirt-tabs" role="group">${sides}</div>
      <p class="tshirt-note">${escapeHtml(text.note)}</p>
    </div>`;
}
