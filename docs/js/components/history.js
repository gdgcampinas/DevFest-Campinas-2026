/**
 * Componente: a seção "Nossa história" da página principal. Só marcação, tudo escapado e por parâmetro: `text` (HISTORY_TEXTS), `milestones` e `mosaic` já com a foto resolvida
 * (features/history.js). Os números ({community}, {devfest}) vêm em `years` e entram DEPOIS de escapar o texto, em destaque (components/number-template.js).
 */
function historyCreditMarkup(photo, text) {
  return photo.credit ? `<small class="history-credit">${escapeHtml(text.photoBy.replace("{name}", photo.credit))}</small>` : "";
}

function historyMilestoneMarkup({ milestone, photo }, { years, text }) {
  return `
    <li class="history-milestone" data-milestone="${escapeHtml(milestone.id)}">
      <figure>
        <img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async">
        ${historyCreditMarkup(photo, text)}
      </figure>
      <div class="history-text">
        <span class="history-year">${escapeHtml(milestone.year)}</span>
        <h3>${numberTemplateMarkup(milestone.title, years)}</h3>
        <p>${numberTemplateMarkup(milestone.text, years)}</p>
      </div>
    </li>`;
}

function historyTileMarkup(photo, text) {
  return `<figure role="listitem"><img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async">${historyCreditMarkup(photo, text)}</figure>`;
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
    ${historyMosaicMarkup(mosaic, text, { visible: galleryVisible })}`;
}
