/**
 * Feature: filtro por trilha — abas "Todas as trilhas" + uma por trilha,
 * reusado pela Grade (cards de palestra) e por Palestrantes (cards de
 * pessoa). O que é comum (desenhar as abas, marcar a ativa, avisar qual
 * trilha foi escolhida) vive em renderTabs/initTabSelection; cada tela
 * só injeta o que fazer com a escolha. Cor da aba vem de track.color
 * (sem CSS por id de trilha).
 */
const ALL_TRACKS = "all";

/** `counts` (opcional): { all, [trackId]: n } mostra a quantidade ao lado do rótulo. */
function renderTabs(tracks, mountEl, { counts = null } = {}) {
  const countMarkup = key => (counts && counts[key] !== undefined ? `<span class="tab-count">${counts[key]}</span>` : "");
  const allTab = `<button class="tab active" data-track="${ALL_TRACKS}" aria-pressed="true">Todas as trilhas${countMarkup(ALL_TRACKS)}</button>`;
  const trackTabs = tracks
    .map(track => `<button class="tab" data-track="${track.id}" aria-pressed="false" style="--track-color:${track.color}">${track.shortLabel}${countMarkup(track.id)}</button>`)
    .join("");
  mountEl.innerHTML = allTab + trackTabs;
}

/** Em telas estreitas as abas rolam na horizontal: traz a escolhida pro meio (sem mexer na rolagem da página). */
function centerTab(tabsEl, tab) {
  if (tabsEl.scrollWidth <= tabsEl.clientWidth) return;
  const tabLeft = tab.getBoundingClientRect().left - tabsEl.getBoundingClientRect().left + tabsEl.scrollLeft;
  tabsEl.scrollTo({ left: tabLeft - (tabsEl.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
}

/**
 * Liga os botões das abas: marca a ativa e chama onSelect(trackId).
 * Devolve `select(trackId)` pra quem precisar trocar de aba por código
 * (ex.: voltar pra "Todas" quando um link aponta pra alguém filtrado).
 */
function initTabSelection(tabsEl, onSelect) {
  function select(trackId) {
    tabsEl.querySelectorAll(".tab").forEach(tab => {
      const active = tab.dataset.track === trackId;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
      if (active) centerTab(tabsEl, tab);
    });
    onSelect(trackId);
  }
  tabsEl.addEventListener("click", event => {
    const tab = event.target.closest(".tab");
    if (tab) select(tab.dataset.track);
  });
  return { select };
}

/**
 * Grade: scopeEl delimita onde o filtro atua — só a agenda completa,
 * nunca o card "acontecendo agora" do hero (mesmo que reaproveite
 * .talks/.talk). Avisa "trackfilterchange" pro filtro de favoritos.
 */
function initTrackFilter(tabsEl, scopeEl) {
  return initTabSelection(tabsEl, track => {
    scopeEl.querySelectorAll(".talks").forEach(talks => (talks.dataset.view = track));
    scopeEl.querySelectorAll(".talk").forEach(card => {
      card.classList.toggle("shown", track === ALL_TRACKS || card.dataset.track === track);
    });
    scopeEl.dispatchEvent(new CustomEvent("trackfilterchange"));
  });
}

/**
 * Palestrantes: mostra só quem tem palestra na trilha escolhida (o card
 * lista as trilhas em data-tracks) e, dentro do card, só as palestras
 * dessa trilha.
 */
function initSpeakerTrackFilter(tabsEl, gridEl) {
  const outside = (trackId, ids) => trackId !== ALL_TRACKS && !ids.includes(trackId);
  return initTabSelection(tabsEl, trackId => {
    gridEl.querySelectorAll(".speaker-card").forEach(card => {
      card.classList.toggle("is-filtered-out", outside(trackId, card.dataset.tracks.split(" ")));
    });
    gridEl.querySelectorAll(".speaker-talk").forEach(ref => {
      ref.classList.toggle("is-filtered-out", outside(trackId, [ref.dataset.track]));
    });
  });
}
