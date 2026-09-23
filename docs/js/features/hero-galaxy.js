/**
 * Insere a galáxia (heroGalaxyMarkup) como primeira camada do palco do hero. Sem palco na
 * página, não faz nada. Com "reduzir movimento" ligado no sistema ela gira mais devagar
 * (`reducedMotionSeconds`); `?movimento=1` na URL força a velocidade normal mesmo assim
 * (útil no telão do evento, onde ninguém mexe nas configurações do sistema).
 * `forceMotion` vem por parâmetro, não lê a URL aqui dentro.
 */
function initHeroGalaxy({ mountEl, config, forceMotion = getParam("movimento") === "1" }) {
  if (!mountEl) return;
  mountEl.insertAdjacentHTML("afterbegin", heroGalaxyMarkup(config));
  mountEl.classList.toggle("hero-stage--motion", forceMotion);
}
