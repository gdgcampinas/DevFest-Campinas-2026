/**
 * Passo a passo com a tela de cada passo (data/gcp-credits.js, `steps`): número grande, imagem, título e frase. Puro template.
 * `compact` encolhe a faixa (cartaz de impressão: só número, tela e título).
 */
function creditStepsMarkup(steps, { compact = false } = {}) {
  const items = steps.map((step, index) => `
    <li class="credit-step">
      <span class="credit-step-num" aria-hidden="true">${index + 1}</span>
      <img class="credit-step-img" src="${step.image}" alt="${step.title}" loading="lazy" decoding="async">
      <h3>${step.title}</h3>
      ${compact ? "" : `<p>${step.text}</p>`}
    </li>`).join("");
  return `<ol class="credit-steps${compact ? " credit-steps--compact" : ""}">${items}</ol>`;
}
