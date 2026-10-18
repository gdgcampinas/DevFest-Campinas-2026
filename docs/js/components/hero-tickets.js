/**
 * Componente: o destaque dos ingressos no topo da home. Só marcação, tudo escapado e por parâmetro: `text` (data/hero-tickets-texts.js) e `cards` ([{ name, price, note, color }], montados em features/hero-tickets.js).
 */
function heroTicketsBadgeMarkup(text) {
  return `<div class="hero-open-badge"><span class="dot"></span>${escapeHtml(text.badge)}</div>`;
}

function heroTicketsCardsMarkup(cards) {
  const items = cards.map(card => `
    <div class="hero-open-card" style="--ticket-color:${escapeHtml(card.color)}">
      <div class="hero-open-name">${escapeHtml(card.name)}</div>
      <div class="hero-open-price">${escapeHtml(card.price)}</div>
      ${card.note ? `<div class="hero-open-note">${escapeHtml(card.note)}</div>` : ""}
    </div>`).join("");
  return `<div class="hero-open-cards">${items}</div>`;
}
