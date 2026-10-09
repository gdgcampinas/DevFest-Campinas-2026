/** Marcação da seção Atalhos do admin: um cartão por tela grande que continua na própria página, com um botão que abre em aba nova. Só texto escapado e classes do styles.css (.mod, .chip-btn) e css/admin.css. */
function adminShortcutsMarkup({ shortcuts }) {
  const card = shortcut => `<li class="ad-card" data-shortcut="${escapeHtml(shortcut.id)}">${adminCardHeadMarkup({ title: shortcut.title, subtitle: shortcut.description })}<div class="ad-links"><a class="chip-btn chip-btn--primary" href="${escapeHtml(shortcut.href)}" target="_blank" rel="noopener">Abrir</a></div></li>`;
  return `<ul class="ad-list">${shortcuts.map(card).join("")}</ul>`;
}
