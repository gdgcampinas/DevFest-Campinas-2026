/**
 * Marcação da visão geral do admin: uma caixa por cartão, cada uma com o próprio estado (carregando, erro ou pronto), pra que um cartão fora do ar nunca derrube os outros.
 * `view` de um cartão pronto: { headline, tone?: "ok" | "warn" | "danger", lines: [texto] }. Só texto escapado e classes do styles.css (.mod) e do css/admin.css.
 */
function adminCardBodyMarkup({ state, view }) {
  if (state === "loading") return '<p class="mod-hint">Carregando…</p>';
  if (state === "error") return '<p class="mod-hint mod-notice" role="status">Não consegui ler agora. Tentando de novo em instantes.</p>';
  const lines = (view.lines ?? []).map(line => `<li>${escapeHtml(line)}</li>`).join("");
  return `<p class="ad-headline${view.tone ? ` is-${escapeHtml(view.tone)}` : ""}">${view.tone ? '<span class="ad-dot" aria-hidden="true"></span>' : ""}${escapeHtml(view.headline)}</p>${lines ? `<ul class="ad-lines">${lines}</ul>` : ""}`;
}

function adminOverviewMarkup({ cards }) {
  return `<ul class="ad-list ad-grid">${cards.map(card => `<li class="ad-card" data-card="${escapeHtml(card.id)}">${adminCardHeadMarkup({ title: card.title })}<div data-card-body="${escapeHtml(card.id)}">${adminCardBodyMarkup({ state: "loading" })}</div></li>`).join("")}</ul>`;
}
