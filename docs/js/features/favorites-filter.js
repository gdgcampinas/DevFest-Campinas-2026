/**
 * Feature: filtro "Minha agenda" da Grade. Liga/desliga o modo
 * `.favs-only` no scopeEl (só CSS esconde o que não é favorito),
 * esconde slots sem favorito visível e mostra o estado vazio.
 * Respeita a aba de trilha ativa (evento "trackfilterchange").
 * Precisa ser inicializado depois de initFavorites (mesma ordem de
 * inscrição no repository), pra .is-fav já estar atualizado.
 */
function renderFavoritesToggle(toggleEl, label) {
  toggleEl.dataset.trackEvent = "my_agenda_view";
  toggleEl.innerHTML = `${iconMarkup("star")}<span>${label}</span><span class="fav-count" data-fav-count>0</span>`;
}

function initFavoritesFilter({ toggleEl, scopeEl, emptyEl, repository }) {
  const countEl = toggleEl.querySelector("[data-fav-count]");

  function isVisibleFavorite(card, view) {
    return card.classList.contains("is-fav") && (view === "all" || card.dataset.track === view);
  }

  function refresh() {
    const only = scopeEl.classList.contains("favs-only");
    toggleEl.classList.toggle("active", only);
    toggleEl.setAttribute("aria-pressed", String(only));
    countEl.textContent = repository.count();

    let anyVisible = false;
    scopeEl.querySelectorAll(".slot").forEach(slotEl => {
      const talksEl = slotEl.querySelector(".talks");
      if (!talksEl) return;
      const view = talksEl.dataset.view;
      const hasFavorite = [...talksEl.querySelectorAll(".talk")].some(card => isVisibleFavorite(card, view));
      slotEl.classList.toggle("no-fav", !hasFavorite);
      anyVisible = anyVisible || hasFavorite;
    });
    emptyEl.hidden = !only || anyVisible;
  }

  toggleEl.addEventListener("click", () => {
    scopeEl.classList.toggle("favs-only");
    refresh();
  });
  scopeEl.addEventListener("trackfilterchange", refresh);
  repository.subscribe(refresh);
  refresh();
}
