/**
 * Componente: a seção "Nossa história" da página principal. Só marcação, tudo escapado e por parâmetro: `text` (HISTORY_TEXTS), `milestones` e `mosaic` já com a foto resolvida
 * (features/history.js). Os números ({community}, {devfest}) vêm em `years` e entram DEPOIS de escapar o texto, em destaque (components/number-template.js).
 */
function historyCreditMarkup(photo, text) {
  return photo.credit ? `<small class="history-credit">${escapeHtml(text.photoBy.replace("{name}", photo.credit))}</small>` : "";
}

/** A foto do marco; sem foto, o `badge` do marco (texto grande) ocupa o lugar dela. */
function historyMilestoneMediaMarkup({ milestone, photo }, text) {
  if (!photo) return `<div class="history-badge" aria-hidden="true">${escapeHtml(milestone.badge)}</div>`;
  return `
      <figure>
        <img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async">
        ${historyCreditMarkup(photo, text)}
      </figure>`;
}

function historyMilestoneMarkup({ milestone, photo }, { years, text }) {
  return `
    <li class="history-milestone" data-milestone="${escapeHtml(milestone.id)}">${historyMilestoneMediaMarkup({ milestone, photo }, text)}
      <div class="history-text">
        <span class="history-year">${escapeHtml(milestone.year)}</span>
        <h3>${numberTemplateMarkup(milestone.title, years)}</h3>
        <p>${numberTemplateMarkup(milestone.text, years)}</p>
      </div>
    </li>`;
}

/** A legenda do evento da foto ("DevFest 2016"), quando a foto tem `event`. */
function historyEventMarkup(photo) {
  return photo.event ? `<small class="history-event">${escapeHtml([photo.event, photo.year].filter(Boolean).join(" "))}</small>` : "";
}

function historyTileMarkup(photo, text) {
  const kind = photo.kind ? ` data-kind="${escapeHtml(photo.kind)}"` : "";
  return `<figure role="listitem"${kind}><img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async">${historyEventMarkup(photo)}${historyCreditMarkup(photo, text)}</figure>`;
}

/** Os botões do filtro da galeria ("Todas" + um por tipo de evento que existe nas fotos); sem tipo nenhum, sem filtro. */
function historyFilterMarkup(photos, text) {
  const kinds = Object.keys(text.filterKinds).filter(kind => photos.some(photo => photo.kind === kind));
  if (!kinds.length) return "";
  const chip = (filter, label, active) => `<button type="button" class="history-chip${active ? " is-active" : ""}" data-filter="${escapeHtml(filter)}" aria-pressed="${active}">${escapeHtml(label)}</button>`;
  return `<div class="history-filter" role="group" aria-label="${escapeHtml(text.filterLabel)}">${chip("all", text.filterAll, true)}${kinds.map(kind => chip(kind, text.filterKinds[kind], false)).join("")}</div>`;
}

/** A galeria: as primeiras `visible` fotos na grade e, se sobrar, o resto dentro de "Ver todas as N fotos" (um <details>, sem script). */
function historyMosaicMarkup(photos, text, { visible = photos.length } = {}) {
  const shown = photos.slice(0, visible);
  const rest = photos.slice(visible);
  const more = rest.length
    ? `<details class="history-more">
        <summary><span class="history-more-open">${numberTemplateMarkup(text.showAll, { n: photos.length })}</span><span class="history-more-close">${escapeHtml(text.showLess)}</span></summary>
        <div class="history-mosaic" role="list">${rest.map(photo => historyTileMarkup(photo, text)).join("")}</div>
      </details>`
    : "";
  return `<div class="history-mosaic" role="list">${shown.map(photo => historyTileMarkup(photo, text)).join("")}</div>${more}`;
}

function historySectionMarkup({ text, milestones, mosaic, years, galleryVisible }) {
  return `
    <div class="history-head">
      <span class="history-kicker">${escapeHtml(text.kicker)}</span>
      <h2>${numberTemplateMarkup(text.title, years)}</h2>
      <p>${escapeHtml(text.sub)}</p>
    </div>
    <ol class="history-timeline">${milestones.map(item => historyMilestoneMarkup(item, { years, text })).join("")}</ol>
    <h3 class="history-mosaic-title">${escapeHtml(text.mosaicTitle)}</h3>
    ${historyFilterMarkup(mosaic, text)}
    ${historyMosaicMarkup(mosaic, text, { visible: galleryVisible })}`;
}

function historySoonMarkup(text) {
  return `<p class="history-soon">${escapeHtml(text.soon)}</p>`;
}

/** O cartão da página principal que leva à página de história: o selo "Desde ...", o título com os anos em destaque e o convite. */
function historyTeaserMarkup({ text, years, href }) {
  return `
    <a class="history-teaser-card" href="${escapeHtml(href)}" data-track-event="history_open" data-track-place="home">
      <span class="history-teaser-kicker">${escapeHtml(text.kicker)}</span>
      <strong>${numberTemplateMarkup(text.linkTitle, years)}</strong>
      <span class="history-teaser-cta">${escapeHtml(text.linkCta)}</span>
    </a>`;
}
