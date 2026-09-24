/**
 * Feature: faixa animada (marquee) no topo — texto montado a partir
 * de EVENT/SCHEDULE que já existem (eventDateLabel de agenda.js),
 * nenhum nome/data duplicado num dado próprio só pra isso. CSS puro
 * (@keyframes), sem lib de carrossel.
 */
function renderTicker(event, schedule, mountEl) {
  const dateLabel = eventDateLabel(schedule, event.timezone);
  const tickets = event.tickets ?? {};
  const status = (tickets.salesOpen && tickets.openStatus) || tickets.status || t("ticker.soon", "Em breve");
  const text = `${event.name} ${event.date.slice(0, 4)} · ${dateLabel} · ${t("ticker.tickets", "Ingressos: {status}", { status })}`;
  const repeated = Array(6).fill(`<span>${text}</span>`).join("");
  mountEl.innerHTML = `<div class="ticker-track">${repeated}</div>`;
}
