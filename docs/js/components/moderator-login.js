/**
 * Bloco de login/conta do moderador (conta Google) — reusado pela moderação de perguntas e pelo sorteio.
 * `signInLabel`/`hint` são específicos de cada tela (o que ela faz), o resto (botão, conta logada, sair) é
 * sempre igual. `data-mod-signin`/`data-mod-signout` são os hooks que os dois handlers já escutam.
 */
function moderatorSignInMarkup({ hint, signInLabel = "Entrar com Google" }) {
  return `<p class="mod-hint">${hint}</p>
    <button type="button" class="chip-btn chip-btn--primary" data-mod-signin>${signInLabel}</button>`;
}

function moderatorAccountMarkup(email) {
  return `<p class="mod-account">${escapeHtml(email)} <button type="button" class="chip-btn" data-mod-signout>Sair</button></p>`;
}
