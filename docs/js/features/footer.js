/**
 * Feature: colunas do rodapé — genérico, mesma renderização pra
 * qualquer número de colunas/links. Coluna sem items não aparece.
 */
function renderFooterColumns(columns, mountEl) {
  mountEl.innerHTML = columns
    .filter(col => col.items.length)
    .map(col => `
      <div class="footer-col">
        <div class="footer-col-title">${col.title}</div>
        ${col.items.map(item => `<a href="${item.url}" target="_blank" rel="noopener">${item.label}</a>`).join("")}
      </div>`)
    .join("");
}
