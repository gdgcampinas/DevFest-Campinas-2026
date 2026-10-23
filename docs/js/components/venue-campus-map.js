/**
 * Componente: o mapa do campus com pontos clicáveis (só marcação, tudo escapado e por parâmetro): `map` (data/venue-map.js), `points`, `types` (cor por tipo), `text` e `selectedId` (o ponto aberto).
 * Hooks: `data-map-point` (pino e botão da lista), `data-map-zoom` (aproximar/afastar).
 */
function venueMapPinMarkup(point, types, selectedId) {
  const color = types[point.kind]?.color ?? "#2b2b33";
  const on = point.id === selectedId;
  return `<button type="button" class="vm-pin${on ? " is-on" : ""}" data-map-point="${escapeHtml(point.id)}" style="left:${point.x}%;top:${point.y}%;--pin:${escapeHtml(color)}" aria-label="${escapeHtml(point.name)}" aria-pressed="${on}"><span>${escapeHtml(point.mark)}</span></button>`;
}

function venueMapLegendMarkup(point, types, selectedId) {
  const color = types[point.kind]?.color ?? "#2b2b33";
  const on = point.id === selectedId;
  return `<button type="button" class="vm-chip${on ? " is-on" : ""}" data-map-point="${escapeHtml(point.id)}" aria-pressed="${on}"><i style="background:${escapeHtml(color)}">${escapeHtml(point.mark)}</i>${escapeHtml(point.name)}</button>`;
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

function venueCampusMapMarkup({ map, points, types, text, selectedId, zoomed }) {
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
        ${points.map(point => venueMapPinMarkup(point, types, selected.id)).join("")}
      </div>
      <button type="button" class="chip-btn vm-zoom" data-map-zoom aria-pressed="${zoomed}">${escapeHtml(zoomed ? text.zoomOut : text.zoomIn)}</button>
    </div>
    <div class="vm-detail" aria-live="polite">${venueMapDetailMarkup(selected)}</div>
    <div class="vm-legend" role="group" aria-label="${escapeHtml(text.legend)}">${points.map(point => venueMapLegendMarkup(point, types, selected.id)).join("")}</div>
    <p class="vm-foot"><a class="chip-btn" href="${escapeHtml(text.officialUrl)}" target="_blank" rel="noopener">${escapeHtml(text.official)}</a><small>${escapeHtml(text.credit)}</small></p>`;
}

if (typeof module !== "undefined") module.exports = { venueCampusMapMarkup, venueMapStageStyle, venueMapDetailMarkup };
