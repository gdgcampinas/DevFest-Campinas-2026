/**
 * Feature: ingressos e CTA de inscrição. Uma única fonte de "estado do
 * CTA" (ticketCtaState) alimenta todos os lugares onde o botão aparece:
 * cabeçalho, barra fixa no mobile, cards de ingresso e hero da home.
 *
 *   waitlistOn   → "Avise-me quando abrir": leva ao cartão da lista de espera (ingressos.html#waitlist), ver applyWaitlistMode
 *   url          → botão de compra (Sympla); com `pageHref` (EVENT.tickets.pageHref) o botão leva à página de ingressos
 *   sem url, mas waitlistUrl → "Avise-me quando abrir" (Instagram/WhatsApp)
 *   nenhum dos dois → só o status ("Em breve"), sem link morto
 */
/** Preço sempre em reais (o valor é em BRL), só a formatação segue o idioma. */
const priceFormatter = price => new Intl.NumberFormat(i18n.locale, { style: "currency", currency: "BRL", minimumFractionDigits: Number.isInteger(price) ? 0 : 2, maximumFractionDigits: 2 });

/** Preço ausente (ainda não definido) vira o texto de `tbdLabel`, em vez de um valor inventado. */
function ticketPriceMarkup(price, { tbdLabel = "" } = {}) {
  if (price == null) return `<div class="ticket-price ticket-price--tbd">${tbdLabel}</div>`;
  return `<div class="ticket-price">${priceFormatter(price).format(price)}</div>`;
}

/**
 * Modo LISTA DE ESPERA (os ingressos ainda não abriram em PRODUÇÃO): com `EVENT.tickets.waitlist.enabled` e `waitlist.public` ligados o site oferece "Avise-me quando abrir" (cartão com formulário,
 * features/waitlist.js) no lugar do botão de compra. Muda o `EVENT.tickets` no lugar, uma vez, antes de qualquer tela ler: `salesOpen` vira falso (faixa "Ingressos em breve", sem contador, oferta
 * "PreOrder"), o link de compra sai (quem clica cairia numa página do Sympla sem ingresso) e `waitlistOn` liga o botão novo. Em modo DEV os ingressos já estão abertos no Sympla: o site mostra as vendas
 * abertas (é a prévia do que a produção vira) e a lista de espera não aparece. Pra abrir em produção: `waitlist.enabled: false`. Devolve se a lista de espera ficou ligada.
 */
function applyWaitlistMode(tickets, { devMode = false } = {}) {
  if (devMode) {
    tickets.salesOpen = true;
    return false;
  }
  const waitlist = tickets.waitlist;
  if (!waitlist?.enabled || !waitlist.public) return false;
  tickets.salesOpen = false;
  tickets.url = "";
  tickets.waitlistOn = true;
  return true;
}

function ticketCtaState(tickets, { label = tickets.label, url = tickets.url, pageHref = "" } = {}) {
  if (url && pageHref && !tickets.waitlistOn) return { kind: "tickets-page", href: pageHref, internal: true, label }; // cabeçalho, barra e topo da home levam à página de ingressos, que escolhe o tipo e só então vai ao Sympla
  if (tickets.waitlistOn) return { kind: "waitlist-form", href: tickets.waitlist.href ?? "ingressos.html#waitlist", internal: true, label: t("tickets.waitlist", "Avise-me quando abrir") };
  if (url) return { kind: "buy", href: url, label };
  if (tickets.waitlistUrl) return { kind: "waitlist", href: tickets.waitlistUrl, label: t("tickets.waitlist", "Avise-me quando abrir") };
  return { kind: "soon", label: tickets.status };
}

/** `place` (opcional) marca de onde veio o clique, pra medição (ver analytics.js). */
function ticketButtonMarkup(state, { className = "cta", place = "" } = {}) {
  if (!state.href) return `<span class="${className} cta--soon">${state.label}</span>`;
  const tracking = place ? ` data-track-event="cta_click" data-track-place="${place}" data-track-kind="${state.kind}"` : "";
  const target = state.internal ? "" : ' target="_blank" rel="noopener"'; // o cartão da lista de espera é do próprio site: abre na mesma aba
  return `<a class="${className}" href="${state.href}"${target}${tracking}>${state.label}</a>`;
}

function ticketCardMarkup(type, tickets, { showcase = () => "" } = {}) {
  const state = ticketCtaState(tickets, { label: t("tickets.buy", "Garantir ingresso"), url: type.url ?? tickets.url });
  const benefits = type.benefits.map(benefit => `<li>${iconMarkup("check")}<span>${benefit}</span></li>`).join("");
  return `
    <div class="ticket${type.featured ? " ticket--featured" : ""}" style="--ticket-color:${type.color}">
      ${type.badge ? `<span class="ticket-badge">${type.badge}</span>` : ""}
      <h3 class="ticket-name">${type.name}</h3>
      ${ticketPriceMarkup(type.price, { tbdLabel: tt(TICKET_PRICE_TBD) })}
      ${showcase(type)}
      <p class="ticket-desc">${type.description}</p>
      <ul class="ticket-benefits">${benefits}</ul>
      ${ticketButtonMarkup(state, { className: "cta cta--block", place: `ticket-${type.id}` })}
    </div>`;
}

/** Seção de ingressos: cards (um por tipo) + aviso. `showcase(type)` (opcional) devolve a vitrine extra do card (ex.: as fotos da camiseta). Some se não houver tipos. */
function renderTickets(tickets, types, sectionEl, { note = "", showcase } = {}) {
  sectionEl.hidden = types.length === 0;
  if (types.length === 0) return;
  sectionEl.querySelector(".tickets-grid").innerHTML = types.map(type => ticketCardMarkup(type, tickets, { showcase })).join("");
  sectionEl.querySelector(".tickets-note").textContent = note;
}

/**
 * CTA global: botão no cabeçalho (todas as páginas) e barra fixa no
 * mobile. A barra some enquanto a seção de ingressos está na tela,
 * porque aí os próprios cards já são o CTA.
 */
function initTicketCta(tickets, { headerTopEl, sectionEl = null }) {
  const state = ticketCtaState(tickets, { pageHref: tickets.pageHref });

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
