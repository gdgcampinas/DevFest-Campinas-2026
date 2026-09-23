/**
 * Insere a galáxia (heroGalaxyMarkup) como primeira camada do palco do hero. Sem palco na
 * página, não faz nada. Por padrão respeita "reduzir movimento" do sistema (a regra global
 * de styles.css deixa o logo parado); `?movimento=1` na URL força a rotação mesmo assim
 * (útil no telão do evento e em demonstrações, onde ninguém mexe nas configurações do
 * sistema). `forceMotion` vem por parâmetro, não lê a URL aqui dentro.
 */
function initHeroGalaxy({ mountEl, config, forceMotion = getParam("movimento") === "1" }) {
  if (!mountEl) return;
  mountEl.insertAdjacentHTML("afterbegin", heroGalaxyMarkup(config));
  mountEl.classList.toggle("hero-stage--motion", forceMotion);
}
