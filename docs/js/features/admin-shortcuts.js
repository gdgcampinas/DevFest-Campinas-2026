/** Feature: seção Atalhos do admin (só links, sem escuta nem login próprio). Tudo por parâmetro: `shortcuts` (data/admin-sections.js). Devolve `{ stop }`, como toda seção do admin. */
function initAdminShortcuts(containerEl, { shortcuts }) {
  containerEl.innerHTML = adminShortcutsMarkup({ shortcuts });
  return { stop: () => {} };
}
