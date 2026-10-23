/**
 * Componente: o mapa do campus com pontos clicáveis (só marcação, tudo escapado e por parâmetro): `map` (data/venue-map.js), `points`, `groups` (ordem dos grupos), `types` (cor por tipo), `text` e `selectedId`.
 * Hooks: `data-map-point` (pino e cartão da lista), `data-map-zoom` (aproximar/afastar), `.vm-tip` (o rótulo do ponto aberto).
 */
const venueMapColor = (point, types) => types[point.kind]?.color ?? "#2b2b33";

function venueMapPinMarkup(point, types, selectedId) {
  const on = point.id === selectedId;
  return `<button type="button" class="vm-pin${on ? " is-on" : ""}" data-map-point="${escapeHtml(point.id)}" style="left:${point.x}%;top:${point.y}%;--pin:${escapeHtml(venueMapColor(point, types))}" aria-label="${escapeHtml(point.name)}" aria-pressed="${on}"><span>${escapeHtml(point.mark)}</span></button>`;
}

/** O rótulo flutuante com o nome do ponto aberto, em cima do pino. */
function venueMapTipMarkup(point) {
  return `<div class="vm-tip" style="left:${point.x}%;top:${point.y}%">${escapeHtml(point.name)}</div>`;
}

function venueMapCardMarkup(point, types, selectedId) {
  const on = point.id === selectedId;
  return `<button type="button" class="vm-card${on ? " is-on" : ""}" data-map-point="${escapeHtml(point.id)}" aria-pressed="${on}" style="--pin:${escapeHtml(venueMapColor(point, types))}"><i>${escapeHtml(point.mark)}</i><span>${escapeHtml(point.name)}</span></button>`;
}

/** O estilo do palco: sem aproximar, a imagem inteira; aproximado, a área `map.focus` no centro (o pino usa `--zoom` para não crescer junto). */
function venueMapStageStyle(map, zoomed) {
  const { x, y, zoom } = map.focus;
  const scale = zoomed ? zoom : 1;
  return `--zoom:${scale};transform:translate(${zoomed ? 50 - x * zoom : 0}%,${zoomed ? 50 - y * zoom : 0}%) scale(${scale})`;
}

function venueMapDetailMarkup(point) {
  return `<strong>${escapeHtml(point.name)}</strong><span>${escapeHtml(point.text)}</span>`;
}

function venueMapGroupsMarkup({ points, groups, types, text, selectedId }) {
  return groups.map(group => {
    const inGroup = points.filter(point => point.group === group);
    return inGroup.length ? `<div class="vm-group"><div class="vm-group-title">${escapeHtml(text.groups[group] ?? group)}</div><div class="vm-cards">${inGroup.map(point => venueMapCardMarkup(point, types, selectedId)).join("")}</div></div>` : "";
  }).join("");
}

function venueCampusMapMarkup({ map, points, groups, types, text, selectedId, zoomed }) {
  const selected = points.find(point => point.id === selectedId) ?? points[0];
  return `
    <div class="vm-head">
      <span class="vm-badge">${escapeHtml(text.badge)}</span>
      <h3>${escapeHtml(text.title)} <span>${escapeHtml(text.titleAccent)}</span></h3>
      <p>${escapeHtml(text.sub)}</p>
    </div>
    <div class="vm-viewport">
      <div class="vm-stage" style="${venueMapStageStyle(map, zoomed)}">
        <img src="${escapeHtml(map.image)}" alt="${escapeHtml(map.alt)}" loading="lazy" decoding="async">
        <div class="vm-dim"></div>
        ${points.map(point => venueMapPinMarkup(point, types, selected.id)).join("")}
        ${venueMapTipMarkup(selected)}
      </div>
      <span class="vm-hint">${escapeHtml(text.hint)}</span>
      <button type="button" class="vm-zoom" data-map-zoom aria-pressed="${zoomed}">${escapeHtml(zoomed ? text.zoomOut : text.zoomIn)}</button>
    </div>
    <div class="vm-detail" aria-live="polite" style="--pin:${escapeHtml(venueMapColor(selected, types))}">${venueMapDetailMarkup(selected)}</div>
    ${venueMapGroupsMarkup({ points, groups, types, text, selectedId: selected.id })}
    <p class="vm-foot"><a class="chip-btn" href="${escapeHtml(text.officialUrl)}" target="_blank" rel="noopener">${escapeHtml(text.official)}</a><small>${escapeHtml(text.credit)}</small></p>`;
}

/** O aviso "em breve" da página enquanto o mapa não é público. */
function venueMapSoonMarkup(text) {
  return `<p class="vm-soon">${escapeHtml(text.soon)}</p>`;
}

/** O cartão-destaque da página principal que leva à página "Como chegar" (`text.callout`: mark, title, sub, cta, href). */
function venueMapCalloutMarkup(text) {
  const callout = text.callout;
  return `<a class="vm-callout" href="${escapeHtml(callout.href)}" data-track-event="venue_map_open" data-track-place="home"><i aria-hidden="true">${escapeHtml(callout.mark)}</i><span class="vm-callout-text"><strong>${escapeHtml(callout.title)}</strong><small>${escapeHtml(callout.sub)}</small></span><b class="vm-callout-cta">${escapeHtml(callout.cta)}</b></a>`;
}

if (typeof module !== "undefined") module.exports = { venueCampusMapMarkup, venueMapStageStyle, venueMapDetailMarkup, venueMapTipMarkup, venueMapSoonMarkup, venueMapCalloutMarkup };
