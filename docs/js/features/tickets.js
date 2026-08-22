/**
 * Feature: seção de ingressos. Sem url ainda → mostra só o status
 * ("Em breve"), sem botão morto apontando pra lugar nenhum.
 */
function renderTickets(tickets, mountEl) {
  const button = tickets.url
    ? `<a class="go go-primary" href="${tickets.url}" target="_blank" rel="noopener">${tickets.label}</a>`
    : `<span class="pill-amber">${tickets.status}</span>`;
  mountEl.innerHTML = button;
}
