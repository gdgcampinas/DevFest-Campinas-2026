/**
 * Card genérico de informação — usado na seção "Antes de vir" e serve
 * pra qualquer outro conteúdo que precise de um card com barra de
 * acento + ícone circular na cor de uma trilha, mesmo sem relação
 * temática com ela (mesmo componente, cor por parâmetro).
 *
 * item: {
 *   id          → vira data-item, usado pra achar o card e ligar eventos depois
 *   trackColor  → cor CSS (ex.: "var(--ia)") aplicada via --track-color
 *   icon        → string SVG já pronta
 *   title, body → texto (body é opcional)
 *   mountId     → opcional: div vazia pra outro módulo montar conteúdo próprio
 *   clickable   → opcional: adiciona role/tabindex pra abrir modal/galeria
 *   linkText    → opcional: rótulo do "Ver X →" quando clickable
 * }
 */
function infoCardMarkup(item) {
  const classes = ["faq-item", item.clickable && "clickable"].filter(Boolean).join(" ");
  const clickableAttrs = item.clickable ? ` role="button" tabindex="0"` : "";
  return `
    <div class="${classes}" data-item="${item.id}" style="--track-color:${item.trackColor}"${clickableAttrs}>
      <div class="faq-icon">${item.icon}</div>
      <h3>${item.title}</h3>
      ${item.body ? `<p>${item.body}</p>` : ""}
      ${item.mountId ? `<div id="${item.mountId}"></div>` : ""}
      ${item.linkText ? `<span class="faq-link">${item.linkText} →</span>` : ""}
    </div>`;
}

function renderInfoCards(items, mountEl) {
  mountEl.innerHTML = items.map(infoCardMarkup).join("");
}
