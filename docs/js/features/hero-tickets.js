/**
 * Feature: o destaque "ingressos abertos" do topo da home. Só existe com as vendas abertas (`tickets.salesOpen`): devolve a marcação do selo e dos cartões (um por tipo de ingresso de data/tickets.js,
 * com nome, preço e vagas) ou vazio. Tudo por parâmetro: `tickets` (EVENT.tickets), `types` (ticketsRepository), `text`, `formatPrice` (padrão: o formatador de reais do site, features/tickets.js).
 */
function heroTicketsHighlight({ tickets, types, text, formatPrice = price => priceFormatter(price).format(price) }) {
  if (!tickets?.salesOpen || !types?.length) return { badge: "", cards: "" };
  const cards = types.map(type => ({ name: type.name, price: type.price == null ? "" : formatPrice(type.price), note: type.badge ?? "", color: type.color }));
  return { badge: heroTicketsBadgeMarkup(text), cards: heroTicketsCardsMarkup(cards) };
}
