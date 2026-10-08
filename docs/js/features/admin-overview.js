/**
 * Feature: a visão geral ao vivo do admin. Recebe uma lista de cartões `{ id, title, watch(onView, onError) }` e liga cada um ao seu espaço na tela; cada cartão se vira sozinho (um que dá erro
 * mostra o aviso só no próprio espaço, e um `watch` que lança também) e todos são desligados juntos pelo `stop()` (que a casca chama ao sair da seção). Os cartões vêm de
 * features/admin-overview-cards.js. Devolve `{ stop }`.
 */
function initAdminOverview(containerEl, { cards }) {
  containerEl.innerHTML = adminOverviewMarkup({ cards });
  const bodies = [...containerEl.querySelectorAll("[data-card-body]")];
  const stops = cards.map(card => {
    const body = bodies.find(element => element.dataset.cardBody === card.id);
    const paint = (state, view) => { body.innerHTML = adminCardBodyMarkup({ state, view }); };
    try {
      return card.watch(view => paint("ready", view), () => paint("error")) ?? (() => {});
    } catch (error) {
      console.warn(`[admin] o cartão ${card.id} não abriu:`, error);
      paint("error");
      return () => {};
    }
  });
  return { stop: () => stops.forEach(stop => stop()) };
}
