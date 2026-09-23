/**
 * Repository da API pública do Sympla. Quem consome pede "participantes"
 * e "pedidos" no formato do nosso domínio e nunca vê versão de rota,
 * paginação ou nome de campo do Sympla.
 *
 * Duas versões de propósito (medido na conta real): a v1.5.1 devolve os
 * participantes com e-mail, tipo de ingresso e check-in (paginação por
 * página); a v1.6.0 devolve os pedidos com o e-mail do comprador
 * (paginação por cursor) mas devolveu participantes vazios em evento
 * passado. Ambas configuráveis por parâmetro.
 */
const BASE_URL = "https://api.sympla.com.br/public";

const MAX_PAGES = 500; // trava de segurança: nunca laço infinito se a API ignorar o parâmetro de página

async function fetchAllPages(fetchPage) {
  const rows = [];
  let next = { page: 1, cursor: null };
  for (let count = 0; next; count += 1) {
    if (count >= MAX_PAGES) throw new Error(`Sympla: mais de ${MAX_PAGES} páginas, abortando`);
    const { data, following } = await fetchPage(next);
    rows.push(...data);
    next = following;
  }
  return rows;
}

function createSymplaRepository({ token, eventIdHash, fetchFn = fetch, baseUrl = BASE_URL, participantsVersion = "v1.5.1", ordersVersion = "v1.6.0", pageSize = 200 }) {
  async function get(version, path, params) {
    const response = await fetchFn(`${baseUrl}/${version}/events/${eventIdHash}${path}?${new URLSearchParams(params)}`, { headers: { s_token: token } });
    if (!response.ok) throw new Error(`Sympla ${response.status} ${version}${path}: ${await response.text()}`);
    return response.json();
  }

  const toParticipant = row => ({
    email: row.email ?? "",
    ticketName: row.ticket_name ?? "",
    orderId: row.order_id ?? "",
    orderStatus: row.order_status ?? "",
    checkedIn: Boolean(row.checkin?.check_in),
    customForm: row.custom_form ?? [],
  });

  const toOrder = row => ({ id: row.id, buyerEmail: row.buyer_email ?? "", status: row.order_status ?? "" });

  return {
    listParticipants: async () =>
      (await fetchAllPages(async ({ page }) => {
        const body = await get(participantsVersion, "/participants", { page: String(page), page_size: String(pageSize) });
        return { data: body.data ?? [], following: body.pagination?.has_next && page < (body.pagination.total_page ?? Infinity) ? { page: page + 1 } : null };
      })).map(toParticipant),

    listOrders: async () =>
      (await fetchAllPages(async ({ cursor }) => {
        const body = await get(ordersVersion, "/orders", { page_size: String(pageSize), ...(cursor ? { cursor } : {}) });
        const nextCursor = body.pagination?.next_cursor;
        return { data: body.data ?? [], following: nextCursor ? { cursor: nextCursor } : null };
      })).map(toOrder),
  };
}

module.exports = { createSymplaRepository };
