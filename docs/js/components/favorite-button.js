/**
 * Botão de favoritar palestra — único template, usado no card da
 * agenda, no card do "ao vivo agora" e no modal de detalhe. O estado
 * (.on / aria-pressed) é sincronizado depois por features/favorites.js
 * via data-talk-key, então o mesmo botão funciona em qualquer lugar.
 */
function favoriteButtonMarkup({ key, active = false, label = t("agenda.save", "Salvar na minha agenda") }) {
  return `<button type="button" class="fav-btn${active ? " on" : ""}" data-talk-key="${key}" data-track-event="favorite_toggle" aria-pressed="${active}" aria-label="${label}" title="${label}">${iconMarkup("star")}</button>`;
}
