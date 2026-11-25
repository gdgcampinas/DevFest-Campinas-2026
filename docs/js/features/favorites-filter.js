/**
 * Feature: filtro "Minha agenda" da Grade. Liga/desliga o modo
 * `.favs-only` no scopeEl (só CSS esconde o que não é favorito),
 * esconde slots sem favorito visível (a plenária conta como palestra; faixas sem palestra ficam) e mostra o estado vazio.
 * Respeita a aba de trilha ativa (evento "trackfilterchange"). `startActive` abre já no modo "Minha agenda" (link "Abrir minha agenda" da home).
 * Precisa ser inicializado depois de initFavorites (mesma ordem de
 * inscrição no repository), pra .is-fav já estar atualizado.
 */
function renderFavoritesToggle(toggleEl, label, { badge = "" } = {}) {
  toggleEl.dataset.trackEvent = "my_agenda_view";
  toggleEl.innerHTML = `${iconMarkup("star")}<span>${label}</span><span class="fav-count" data-fav-count>0</span>${badge}`;
}

function initFavoritesFilter({ toggleEl, scopeEl, emptyEl, repository, startActive = false }) {
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
      const keynoteEl = slotEl.querySelector(".banner--keynote[data-talk-key]"); // a plenária: faixa com a fala dela e estrela
      if (!talksEl && !keynoteEl) return; // faixa sem palestra (credenciamento, almoço): fica sempre visível, é o esqueleto do dia
      const hasFavorite = talksEl
        ? [...talksEl.querySelectorAll(".talk")].some(card => isVisibleFavorite(card, talksEl.dataset.view))
        : keynoteEl.classList.contains("is-fav");
      slotEl.classList.toggle("no-fav", !hasFavorite);
      anyVisible = anyVisible || hasFavorite;
    });
    const savedParallel = Boolean(scopeEl.querySelector(".parallel-card.is-fav")); // a sessão em paralelo salva também conta como "tem o que mostrar"
    emptyEl.hidden = !only || anyVisible || savedParallel;
  }

  toggleEl.addEventListener("click", () => {
    scopeEl.classList.toggle("favs-only");
    refresh();
  });
  scopeEl.addEventListener("trackfilterchange", refresh);
  repository.subscribe(refresh);
  if (startActive) scopeEl.classList.add("favs-only");
  refresh();
}
