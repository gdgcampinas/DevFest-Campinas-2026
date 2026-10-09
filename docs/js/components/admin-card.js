/** Estado vazio padrão do admin: o Gumbleton e uma frase (lista de moderadores, filas de recados). Uma marcação só pras telas que têm lista. */
function adminEmptyMarkup(text) {
  return `<div class="ad-empty">${mascotMarkup("ad-empty-mascot")}<p>${escapeHtml(text)}</p></div>`;
}

/** Cabeçalho padrão das caixas do admin (título e, opcionalmente, uma linha de apoio): uma marcação só pra Palestras, Atalhos, Antes do evento, Moderadores e a Visão geral. Só texto escapado. */
function adminCardHeadMarkup({ title, subtitle = "", icon = "" }) {
  return `<div class="ad-card-head">${icon ? adminIconMarkup(icon) : ""}<div><h2 class="mod-section-title">${escapeHtml(title)}</h2>${subtitle ? `<p class="mod-hint">${escapeHtml(subtitle)}</p>` : ""}</div></div>`;
}
