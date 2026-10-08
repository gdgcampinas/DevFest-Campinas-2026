/**
 * Marcação do casco da área de admin (admin.html): a porta de entrada (login Google), a barra da conta com o título da seção e as mensagens de seção. Só texto escapado e classes do styles.css (.mod)
 * e do css/admin.css; o login reusa components/moderator-login.js. Os hooks são `data-*` (features/admin-shell.js).
 */
function adminSignInGateMarkup({ message = "" } = {}) {
  return `<h1 class="mod-title">Área de admin</h1>
    ${moderatorSignInMarkup({ hint: "Entre com a conta Google de moderador pra controlar o telão, as palestras e a moderação." })}
    ${message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : ""}`;
}

function adminShellMarkup({ email }) {
  return `${moderatorAccountMarkup(email)}
    <h1 class="mod-title" data-admin-title></h1>
    <div data-admin-view></div>`;
}

/** Seção sem tela montada ou que falhou ao abrir: um aviso no lugar, o resto do admin segue. */
function adminSectionNoticeMarkup(text) {
  return `<p class="mod-hint mod-notice" role="status">${escapeHtml(text)}</p>`;
}
