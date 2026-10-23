/**
 * Feature: o mapa do campus na seção "Local". `initVenueCampusMap(sectionEl, { map, points, types, text, config, devMode })` mostra o mapa (só em DEV até `config.public`, ver features/release-gate.js), seleciona o ponto
 * ao clicar no pino ou na lista (com teclado, pelos botões) e aproxima/afasta o H-02. Devolve se ficou visível. Tudo por parâmetro.
 */
function initVenueCampusMap(sectionEl, { map, points, types, text, config, devMode = false }) {
  const visible = isReleased(config, { devMode });
  if (!sectionEl) return false;
  sectionEl.hidden = !visible;
  if (!visible) return false;
  const state = { selectedId: map.selectedId ?? points[0].id, zoomed: false };
  sectionEl.innerHTML = venueCampusMapMarkup({ map, points, types, text, ...state });
  const stage = sectionEl.querySelector(".vm-stage");
  const zoomButton = sectionEl.querySelector("[data-map-zoom]");
  // atualiza no lugar (sem refazer o HTML): a transição da aproximação anima e o foco e a rolagem da página ficam onde estavam
  const select = id => {
    state.selectedId = id;
    sectionEl.querySelectorAll("[data-map-point]").forEach(el => {
      const on = el.dataset.mapPoint === id;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", String(on));
    });
    sectionEl.querySelector(".vm-detail").innerHTML = venueMapDetailMarkup(points.find(point => point.id === id));
  };
  const zoom = () => {
    state.zoomed = !state.zoomed;
    stage.setAttribute("style", venueMapStageStyle(map, state.zoomed));
    zoomButton.textContent = state.zoomed ? text.zoomOut : text.zoomIn;
    zoomButton.setAttribute("aria-pressed", String(state.zoomed));
  };
  sectionEl.addEventListener("click", event => {
    const point = event.target.closest("[data-map-point]");
    if (point) select(point.dataset.mapPoint);
    else if (event.target.closest("[data-map-zoom]")) zoom();
  });
  return true;
}

if (typeof module !== "undefined") module.exports = { initVenueCampusMap };
