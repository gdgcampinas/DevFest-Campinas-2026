/**
 * Markup do contador ao vivo e da faixa "acabaram de entrar" do sorteio (aparecem no modo telão, ver
 * .raffle-telao em styles.css). Só desenham; features/raffle-draw.js decide quem e quando.
 * `newIds` = quem chegou desde o último desenho (ganha a animação de entrada, uma vez só).
 */
function raffleCounterMarkup(count) {
  return `<div class="raffle-counter" aria-live="polite"><span class="raffle-counter-value">${count}</span><span class="raffle-counter-label">${tn("raffle.counterLabel", count, "pessoa cadastrada", "pessoas cadastradas")}</span></div>`;
}

function raffleArrivalsMarkup(arrivals, newIds = new Set()) {
  if (!arrivals.length) return "";
  const items = arrivals.map(person => `<li class="raffle-arrival${newIds.has(person.id) ? " is-new" : ""}">${escapeHtml(raffleDisplayName(person))}</li>`).join("");
  return `<div class="raffle-arrivals"><span class="raffle-arrivals-title">${t("raffle.arrivalsTitle", "Acabaram de entrar")}</span><ul class="raffle-arrivals-list">${items}</ul></div>`;
}
