/**
 * Feature: o mapa do campus. `initVenueCampusMap(sectionEl, { map, points, groups, types, text, config, devMode, soon })` mostra o mapa (só em DEV até `config.public`, ver features/release-gate.js), seleciona o ponto
 * ao clicar no pino ou no cartão e aproxima/afasta o H-02. Fora da liberação a seção some, ou mostra o aviso "em breve" com `soon: true` (a página). Devolve se o mapa ficou visível.
 * `initVenueMapCallout(el, { text, config, devMode })` é o cartão-destaque da principal, com a mesma regra. Tudo por parâmetro.
 */
function initVenueCampusMap(sectionEl, { map, points, groups, types, text, config, devMode = false, soon = false }) {
  if (!sectionEl) return false;
  const visible = isReleased(config, { devMode });
  sectionEl.hidden = !visible && !soon;
  if (!visible) {
    sectionEl.innerHTML = soon ? venueMapSoonMarkup(text) : "";
    return false;
  }
  sectionEl.innerHTML = venueCampusMapMarkup({ map, points, groups, types, text, selectedId: map.selectedId ?? points[0].id, zoomed: false });
  const stage = sectionEl.querySelector(".vm-stage");
  const zoomButton = sectionEl.querySelector("[data-map-zoom]");
  let zoomed = false;
  // atualiza no lugar (sem refazer o HTML): a transição da aproximação anima e o foco e a rolagem da página ficam onde estavam
  const select = id => {
    const point = points.find(item => item.id === id);
    sectionEl.querySelectorAll("[data-map-point]").forEach(el => {
      const on = el.dataset.mapPoint === id;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", String(on));
    });
    sectionEl.querySelector(".vm-tip").outerHTML = venueMapTipMarkup(point);
    const detail = sectionEl.querySelector(".vm-detail");
    detail.innerHTML = venueMapDetailMarkup(point);
    detail.style.setProperty("--pin", venueMapColor(point, types));
  };
  const zoom = () => {
    zoomed = !zoomed;
    stage.setAttribute("style", venueMapStageStyle(map, zoomed));
    zoomButton.textContent = zoomed ? text.zoomOut : text.zoomIn;
    zoomButton.setAttribute("aria-pressed", String(zoomed));
  };
  sectionEl.addEventListener("click", event => {
    const point = event.target.closest("[data-map-point]");
    if (point) select(point.dataset.mapPoint);
    else if (event.target.closest("[data-map-zoom]")) zoom();
  });
  return true;
}

function initVenueMapCallout(el, { text, config, devMode = false }) {
  if (!el) return false;
  const visible = isReleased(config, { devMode });
  el.hidden = !visible;
  el.innerHTML = visible ? venueMapCalloutMarkup(text) : "";
  return visible;
}

if (typeof module !== "undefined") module.exports = { initVenueCampusMap, initVenueMapCallout };
