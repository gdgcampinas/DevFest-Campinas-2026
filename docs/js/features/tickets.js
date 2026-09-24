/**
 * Feature: ingressos e CTA de inscrição. Uma única fonte de "estado do
 * CTA" (ticketCtaState) alimenta todos os lugares onde o botão aparece:
 * cabeçalho, barra fixa no mobile, cards de ingresso e hero da home.
 *
 *   url          → botão de compra (Sympla)
 *   sem url, mas waitlistUrl → "Avise-me quando abrir" (Instagram/WhatsApp)
 *   nenhum dos dois → só o status ("Em breve"), sem link morto
 */
/** Preço sempre em reais (o valor é em BRL), só a formatação segue o idioma. */
const priceFormatter = () => new Intl.NumberFormat(i18n.locale, { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Preço ausente (ainda não definido) vira o texto de `tbdLabel`, em vez de um valor inventado. */
function ticketPriceMarkup(price, { tbdLabel = "" } = {}) {
  if (price == null) return `<div class="ticket-price ticket-price--tbd">${tbdLabel}</div>`;
  return `<div class="ticket-price">${priceFormatter().format(price)}</div>`;
}

function ticketCtaState(tickets, { label = tickets.label, url = tickets.url } = {}) {
  if (url) return { kind: "buy", href: url, label };
  if (tickets.waitlistUrl) return { kind: "waitlist", href: tickets.waitlistUrl, label: t("tickets.waitlist", "Avise-me quando abrir") };
  return { kind: "soon", label: tickets.status };
}

/** `place` (opcional) marca de onde veio o clique, pra medição (ver analytics.js). */
function ticketButtonMarkup(state, { className = "cta", place = "" } = {}) {
  if (!state.href) return `<span class="${className} cta--soon">${state.label}</span>`;
  const tracking = place ? ` data-track-event="cta_click" data-track-place="${place}" data-track-kind="${state.kind}"` : "";
  return `<a class="${className}" href="${state.href}" target="_blank" rel="noopener"${tracking}>${state.label}</a>`;
}

function ticketCardMarkup(type, tickets) {
  const state = ticketCtaState(tickets, { label: t("tickets.buy", "Garantir ingresso"), url: type.url ?? tickets.url });
  const benefits = type.benefits.map(benefit => `<li>${iconMarkup("check")}<span>${benefit}</span></li>`).join("");
  return `
    <div class="ticket${type.featured ? " ticket--featured" : ""}" style="--ticket-color:${type.color}">
      ${type.badge ? `<span class="ticket-badge">${type.badge}</span>` : ""}
      <h3 class="ticket-name">${type.name}</h3>
      ${ticketPriceMarkup(type.price, { tbdLabel: tt(TICKET_PRICE_TBD) })}
      <p class="ticket-desc">${type.description}</p>
      <ul class="ticket-benefits">${benefits}</ul>
      ${ticketButtonMarkup(state, { className: "cta cta--block", place: `ticket-${type.id}` })}
    </div>`;
}

/** Seção de ingressos: cards (um por tipo) + aviso. Some se não houver tipos. */
function renderTickets(tickets, types, sectionEl, { note = "" } = {}) {
  sectionEl.hidden = types.length === 0;
  if (types.length === 0) return;
  sectionEl.querySelector(".tickets-grid").innerHTML = types.map(type => ticketCardMarkup(type, tickets)).join("");
  sectionEl.querySelector(".tickets-note").textContent = note;
}

/**
 * CTA global: botão no cabeçalho (todas as páginas) e barra fixa no
 * mobile. A barra some enquanto a seção de ingressos está na tela,
 * porque aí os próprios cards já são o CTA.
 */
function initTicketCta(tickets, { headerTopEl, sectionEl = null }) {
  const state = ticketCtaState(tickets);

  const actionsEl = document.createElement("div");
  actionsEl.className = "header-actions";
  const pillEl = headerTopEl.querySelector(".status-pill");
  if (pillEl) actionsEl.appendChild(pillEl);
  actionsEl.insertAdjacentHTML("beforeend", ticketButtonMarkup(state, { className: "cta cta--header", place: "header" }));
  headerTopEl.appendChild(actionsEl);

  const barEl = document.createElement("div");
  barEl.className = "cta-bar";
  barEl.innerHTML = ticketButtonMarkup(state, { className: "cta cta--block", place: "bar" });
  document.body.appendChild(barEl);
  document.body.classList.add("has-cta-bar");

  if (sectionEl && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => barEl.classList.toggle("is-hidden", entry.isIntersecting),
      { threshold: 0.15 }
    ).observe(sectionEl);
  }
}
