/**
 * Feature: favoritos ("Minha agenda"). Um único listener delegado no
 * rootEl cobre qualquer botão .fav-btn — card da agenda, card do "ao
 * vivo agora" e modal de detalhe — e o estado visual é sincronizado
 * por data-talk-key, então favoritar num lugar acende em todos.
 * Dado vem do repository injetado (data/persisted-set-repository.js).
 */
function syncFavorites(rootEl, repository) {
  rootEl.querySelectorAll("[data-talk-key]").forEach(el => {
    const active = repository.has(el.dataset.talkKey);
    if (el.classList.contains("fav-btn")) {
      el.classList.toggle("on", active);
      el.setAttribute("aria-pressed", String(active));
    } else {
      el.classList.toggle("is-fav", active);
    }
  });
}

function initFavorites(rootEl, repository) {
  rootEl.addEventListener("click", event => {
    const btn = event.target.closest(".fav-btn");
    if (btn) repository.toggle(btn.dataset.talkKey);
  });
  repository.subscribe(() => syncFavorites(rootEl, repository));
  syncFavorites(rootEl, repository);
}
