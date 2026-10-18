/**
 * Marcação da tela de BLOQUEIO das áreas de moderação: "esta conta não está liberada" (com a conta que entrou e o botão de entrar com outra) ou "não consegui verificar" (com o botão de tentar de novo).
 * Só texto escapado e classes do styles.css (.mod, .chip-btn); os hooks são `data-mod-signout` e `data-mod-retry`, que cada tela já ouve. `text` = data/moderator-access-texts.js.
 */
function moderatorBlockedMarkup({ state, email = "", text }) {
  if (state === "unknown") {
    return `<section class="mod-gate" role="alert">
      <h2 class="mod-section-title">${escapeHtml(text.unknownTitle)}</h2>
      <p class="mod-hint">${escapeHtml(text.unknownBody)}</p>
      <div class="ad-links"><button type="button" class="chip-btn chip-btn--primary" data-mod-retry>${escapeHtml(text.retryButton)}</button><button type="button" class="chip-btn" data-mod-signout>${escapeHtml(text.switchButton)}</button></div>
    </section>`;
  }
  return `<section class="mod-gate" role="alert">
    <h2 class="mod-section-title">${escapeHtml(text.deniedTitle)}</h2>
    <p class="mod-hint">${escapeHtml(text.deniedBody.replace("{email}", email))}</p>
    <div class="ad-links"><button type="button" class="chip-btn chip-btn--primary" data-mod-signout>${escapeHtml(text.switchButton)}</button></div>
  </section>`;
}
