/**
 * Marcação do menu da área de admin: uma lista de links, um por seção. `base` é a página do admin ("" quando já se está nela, "admin.html" nas telas de moderação que têm o menu por cima) e `current`
 * a seção em destaque. Só texto escapado e classes do styles.css (.chip-btn) e do css/admin.css.
 */
function adminNavMarkup({ sections, current = "", base = "" }) {
  const link = section => `<li><a class="chip-btn${section.id === current ? " chip-btn--primary" : ""}" href="${escapeHtml(`${base}#${section.id}`)}"${section.id === current ? ' aria-current="page"' : ""}>${escapeHtml(section.title)}</a></li>`;
  return `<ul class="ad-nav-list">${sections.map(link).join("")}</ul>`;
}
