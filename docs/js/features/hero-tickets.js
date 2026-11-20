/**
 * Feature: o destaque "ingressos abertos" do topo da home. Só existe com as vendas abertas (`tickets.salesOpen`): devolve a marcação do selo e dos cartões (um por tipo de ingresso de data/tickets.js,
 * com nome, preço e vagas; o tipo encerrado (`ticketSoldOut`) mostra `soldOutLabel` no lugar das vagas) ou vazio. Tudo por parâmetro: `tickets` (EVENT.tickets), `types` (ticketsRepository), `text`, `devMode`, `soldOutLabel`, `formatPrice` (padrão: o formatador de reais do site, features/tickets.js).
 */
function heroTicketsHighlight({ tickets, types, text, devMode = false, soldOutLabel = "", formatPrice = price => priceFormatter(price).format(price) }) {
  if (!tickets?.salesOpen || !types?.length) return { badge: "", cards: "" };
  const cards = types.map(type => {
    const soldOut = ticketSoldOut(type, { devMode });
    return { name: type.name, price: type.price == null ? "" : formatPrice(type.price), note: (soldOut ? soldOutLabel : type.badge) ?? "", color: type.color, soldOut };
  });
  return { badge: heroTicketsBadgeMarkup(text), cards: heroTicketsCardsMarkup(cards) };
}
