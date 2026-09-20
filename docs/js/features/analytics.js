/**
 * Feature: medição de uso, desacoplada do provedor. As telas nunca
 * chamam analytics: elas só marcam elementos com data-track-event
 * (mais data-track-place / data-track-target / data-track-kind, opcionais)
 * e um único listener delegado transforma cada clique em um evento.
 * O provedor é um adapter injetado (DI): { load(), event(name, props) }.
 *
 * Depuração: abrir qualquer página com ?analytics=debug mostra cada
 * evento no console, mesmo sem provedor configurado.
 */
const ANALYTICS_ADAPTERS = {
  /** GoatCounter: script oficial + eventos como "caminhos" marcados com event:true. */
  goatcounter: config => ({
    load() {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://gc.zgo.at/count.js";
      script.dataset.goatcounter = config.endpoint;
      document.head.appendChild(script);
    },
    event(name, props) {
      window.goatcounter?.count?.({ path: eventPath(name, props), title: name, event: true });
    },
  }),
};

/** "cta_click/header": nome + o primeiro detalhe disponível (place, target ou kind). */
function eventPath(name, props) {
  return [name, props.place || props.target || props.kind].filter(Boolean).join("/");
}

function eventFromElement(el) {
  const { trackEvent, trackPlace, trackTarget, trackKind } = el.dataset;
  return { name: trackEvent, props: { place: trackPlace, target: trackTarget, kind: trackKind } };
}

/**
 * Liga a medição. Devolve { enabled, track } (track é no-op sem provedor).
 * `adapters` e `debug` são injetáveis pra teste.
 */
function initAnalytics(config, { rootEl = document, adapters = ANALYTICS_ADAPTERS, debug = getParam("analytics") === "debug" } = {}) {
  const adapter = config.endpoint ? adapters[config.provider]?.(config) : null;
  if (adapter) adapter.load();
  if (!adapter && !debug) return { enabled: false, track: () => {} };

  const track = (name, props = {}) => {
    if (debug) console.info("[analytics]", name, props);
    adapter?.event(name, props);
  };

  rootEl.addEventListener("click", event => {
    const el = event.target.closest("[data-track-event]");
    if (el) track(...Object.values(eventFromElement(el)));
  });

  if (adapter && config.notice) {
    const creditsEl = document.querySelector(".credits");
    if (creditsEl) creditsEl.insertAdjacentHTML("beforeend", `<div class="analytics-notice">${config.notice}</div>`);
  }
  return { enabled: Boolean(adapter), track };
}
