/**
 * Feature: o mapa do campus. `initVenueCampusMap(sectionEl, { map, points, groups, types, text, config, devMode, soon })` mostra o mapa (só em DEV até `config.public`, ver features/release-gate.js), seleciona o ponto
 * ao clicar no pino ou no cartão da lista e aproxima/afasta o H-02. Escolher na LISTA também aproxima o mapa no ponto e leva a tela até o mapa (`reveal`, injetável; padrão `revealElement`); o pino não mexe na tela.
 * Fora da liberação a seção some, ou mostra o aviso "em breve" com `soon: true` (a página). Devolve se o mapa ficou visível.
 * `initVenueMapCallout(el, { text, config, devMode })` é o cartão-destaque da principal, com a mesma regra. Tudo por parâmetro.
 */
/** Leva a tela até `el` (suave, ou direta com "reduzir movimento"), só se ele não estiver todo à vista. A folga do topo vem do CSS (`scroll-margin-top`). */
function revealElement(el, win = window) {
  const { top, bottom } = el.getBoundingClientRect();
  if (top >= 0 && bottom <= win.innerHeight) return;
  const reduced = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

function initVenueCampusMap(sectionEl, { map, points, groups, types, text, config, devMode = false, soon = false, reveal = revealElement }) {
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
  const view = { zoomed: false, focus: map.focus };
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
  const setView = (zoomed, focus = map.focus) => {
    Object.assign(view, { zoomed, focus });
    stage.setAttribute("style", venueMapStageStyle(map, zoomed, focus));
    zoomButton.textContent = zoomed ? text.zoomOut : text.zoomIn;
    zoomButton.setAttribute("aria-pressed", String(zoomed));
  };
  sectionEl.addEventListener("click", event => {
    const target = event.target.closest("[data-map-point]");
    if (target) {
      select(target.dataset.mapPoint);
      if (target.classList.contains("vm-card")) { // escolheu na lista: aproxima no ponto e mostra o mapa
        setView(true, points.find(item => item.id === target.dataset.mapPoint));
        reveal(sectionEl.querySelector(".vm-viewport"));
      }
    } else if (event.target.closest("[data-map-zoom]")) setView(!view.zoomed);
  });
  return true;
}

function initVenueMapCallout(el, { text, config, devMode = false, access = "" }) {
  if (!el) return false;
  const visible = isReleased(config, { devMode });
  el.hidden = !visible;
  el.innerHTML = visible ? venueMapCalloutMarkup(text, access) : "";
  return visible;
}

if (typeof module !== "undefined") module.exports = { initVenueCampusMap, initVenueMapCallout };
