/**
 * Componente: o topo da página de ingressos (selo, título colorido, frase de apoio e os 3 passos). Só marcação, tudo escapado e por parâmetro: `text` (data/tickets-hero-texts.js) e `open` (vendas
 * abertas: só então o selo "INGRESSOS ABERTOS" aparece).
 */
function ticketsHeroMarkup({ text, open = true }) {
  const brand = text.brand.map(word => `<span style="color:${escapeHtml(word.color)}">${escapeHtml(word.text)}</span>`).join(" ");
  const steps = text.steps.map((step, index) => `
    <li class="th-step" style="--step-color:${escapeHtml(step.color)}">
      <span class="th-step-n">${index + 1}</span>
      <strong>${escapeHtml(step.title)}</strong>
      <span>${escapeHtml(step.hint)}</span>
    </li>`).join("");
  return `
    ${open ? `<span class="th-badge"><span class="dot"></span>${escapeHtml(text.badge)}</span>` : ""}
    <h2 class="th-title">${escapeHtml(text.lead)}<br>${brand}</h2>
    <p class="th-sub">${escapeHtml(text.sub)}</p>
    <ol class="th-steps">${steps}</ol>`;
}
