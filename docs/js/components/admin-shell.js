/**
 * Marcação do casco da área de admin (admin.html): a porta de entrada (login Google), a barra do topo (nome da área, título da seção, conta e Sair) e as mensagens de seção. Só texto escapado e classes
 * do styles.css (.mod) e do css/admin.css; o login reusa components/moderator-login.js e o avatar components/initial-avatar.js. Os hooks são `data-*` (features/admin-shell.js).
 */
function adminSignInGateMarkup({ brand, message = "" }) {
  return `<div class="ad-bar"><div><p class="ad-brand">${escapeHtml(brand.subtitle)}</p><h1 class="mod-title">${escapeHtml(brand.title)}</h1></div></div>
    ${moderatorSignInMarkup({ hint: "Entre com a conta Google de moderador pra controlar o telão, as palestras e a moderação." })}
    ${message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : ""}`;
}

function adminShellMarkup({ brand, email }) {
  return `<div class="ad-bar">
      <div><p class="ad-brand">${escapeHtml(brand.title)} · ${escapeHtml(brand.subtitle)}</p><h1 class="mod-title" data-admin-title></h1></div>
      <p class="mod-account ad-account">${initialAvatarMarkup(email, { size: 32 })}<span class="ad-email">${escapeHtml(email)}</span><button type="button" class="chip-btn" data-mod-signout>Sair</button></p>
    </div>
    <div data-admin-view></div>`;
}

/** Seção sem tela montada ou que falhou ao abrir: um aviso no lugar, o resto do admin segue. */
function adminSectionNoticeMarkup(text) {
  return `<p class="mod-hint mod-notice" role="status">${escapeHtml(text)}</p>`;
}
