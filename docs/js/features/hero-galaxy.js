/** Insere a galáxia (heroGalaxyMarkup) como primeira camada do palco do hero. Sem palco na página, não faz nada. */
function initHeroGalaxy({ mountEl, config }) {
  if (!mountEl) return;
  mountEl.insertAdjacentHTML("afterbegin", heroGalaxyMarkup(config));
}
