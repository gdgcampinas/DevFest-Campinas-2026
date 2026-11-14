/**
 * Passo a passo com a tela de cada passo (data/gcp-credits.js, `steps`). Puro template, dois formatos:
 *   padrão   uma linha por passo, grande e legível: número, título, frase (e `badge`, o selo de destaque, quando o passo tem) de um lado e a tela do outro; a tela é um botão
 *            `data-zoom-src` (features/image-zoom.js abre ampliada) com a dica `zoomHint`
 *   compact  cartaz de impressão: só número, título e tela, sem botão
 */
function creditStepsMarkup(steps, { compact = false, zoomHint = "" } = {}) {
  const items = steps.map((step, index) => {
    const number = `<span class="credit-step-num" aria-hidden="true">${index + 1}</span>`;
    if (compact) {
      return `<li class="credit-step"><div class="credit-step-head">${number}<h3>${step.title}</h3></div><div class="credit-step-screen"><img src="${step.image}" alt="${step.title}" loading="lazy" decoding="async"></div></li>`;
    }
    return `
    <li class="credit-step${step.badge ? " credit-step--key" : ""}">
      <div class="credit-step-text">
        <div class="credit-step-head">${number}<h3>${step.title}</h3></div>
        ${step.badge ? `<span class="credit-step-badge">${step.badge}</span>` : ""}
        <p>${step.text}</p>
      </div>
      <button type="button" class="credit-step-screen" data-zoom-src="${step.image}" data-zoom-alt="${step.title}" aria-label="${zoomHint}: ${step.title}">
        <img src="${step.image}" alt="${step.title}" loading="lazy" decoding="async">
        <span class="credit-step-zoom">${zoomHint}</span>
      </button>
    </li>`;
  }).join("");
  return `<ol class="credit-steps${compact ? " credit-steps--compact" : ""}">${items}</ol>`;
}
