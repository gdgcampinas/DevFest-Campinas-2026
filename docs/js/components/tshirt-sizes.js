/**
 * Componente: o guia de tamanhos da camiseta (abas por modelo, desenho com a altura e a largura marcadas e a tabela em centímetros). Só marcação, tudo escapado e por parâmetro: `models`
 * (data/tshirt-sizes.js), `text` (TSHIRT_SIZES_TEXTS) e `activeId` (a aba aberta). Hooks: `data-sizes-model`.
 */
function tshirtDiagramMarkup(text) {
  return `
    <svg class="ts-diagram" viewBox="0 0 240 270" role="img" aria-label="${escapeHtml(text.diagramLabel)}">
      <path class="ts-shirt" d="M78 34 L104 24 Q120 40 136 24 L162 34 L212 66 L188 104 L168 90 L168 244 Q168 250 162 250 L78 250 Q72 250 72 244 L72 90 L52 104 L28 66 Z"/>
      <path class="ts-collar" d="M104 24 Q120 46 136 24"/>
      <g class="ts-height"><line x1="96" y1="34" x2="96" y2="250"/><path d="M90 42 L96 32 L102 42 M90 242 L96 252 L102 242"/><text x="96" y="200" transform="rotate(-90 96 200)" text-anchor="middle" dy="-8">${escapeHtml(text.heightLabel)}</text></g>
      <g class="ts-width"><line x1="72" y1="132" x2="168" y2="132"/><path d="M82 126 L70 132 L82 138 M158 126 L170 132 L158 138"/><text x="128" y="120" text-anchor="middle">${escapeHtml(text.widthLabel)}</text></g>
    </svg>`;
}

function tshirtSizesMarkup({ models, text, activeId }) {
  const model = models.find(item => item.id === activeId) ?? models[0];
  const tabs = models.map(item => `<button type="button" class="chip-btn${item.id === model.id ? " chip-btn--primary" : ""}" data-sizes-model="${escapeHtml(item.id)}" aria-pressed="${item.id === model.id}">${escapeHtml(item.label)}</button>`).join("");
  const rows = model.sizes.map(row => `<tr><th scope="row">${escapeHtml(row.size)}</th><td>${row.height} ${escapeHtml(text.unit)}</td><td>${row.width} ${escapeHtml(text.unit)}</td></tr>`).join("");
  return `
    <div class="ts-head">
      <span class="ts-badge">${escapeHtml(text.badge)}</span>
      <h2>${escapeHtml(text.title)}</h2>
      <p>${escapeHtml(text.sub)}</p>
    </div>
    <div class="ts-tabs" role="group">${tabs}</div>
    <div class="ts-body">
      <div class="ts-figure">${tshirtDiagramMarkup(text)}</div>
      <div class="ts-table-wrap">
        <table class="ts-table">
          <thead><tr><th scope="col">${escapeHtml(text.columns.sizeName)}</th><th scope="col">${escapeHtml(text.columns.height)}</th><th scope="col">${escapeHtml(text.columns.width)}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
    <div class="ts-notes">
      <div class="ts-note ts-note--warn">${iconMarkup("info")}<p>${escapeHtml(text.approx)}</p></div>
      <div class="ts-note ts-note--tip">${iconMarkup("ruler")}<p><strong>${escapeHtml(text.tipTitle)}</strong>${escapeHtml(text.tip)}</p></div>
    </div>`;
}

/** O atalho "Guia de tamanhos" (botão no card do ingresso e na galeria da camiseta): leva ao guia da página de ingressos. */
function tshirtSizesLinkMarkup(text) {
  return `<a class="ts-link" href="#tamanhos" data-tshirt-sizes-link>${iconMarkup("ruler")}<span>${escapeHtml(text.shortcut)}</span></a>`;
}
