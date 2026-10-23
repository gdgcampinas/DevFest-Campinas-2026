/**
 * Componente: os atributos de medição de um elemento clicável (features/analytics.js ouve `data-track-event` e transforma cada clique em um evento).
 * `trackAttrs("map_point", { place: "map", target: "gate2" })` devolve ` data-track-event="map_point" data-track-place="map" data-track-target="gate2"` (só o que veio preenchido, escapado).
 * É o único lugar que monta esses atributos: as telas só chamam esta função.
 */
function trackAttrs(name, { place, target, kind } = {}) {
  const parts = [["event", name], ["place", place], ["target", target], ["kind", kind]].filter(([, value]) => value);
  return parts.map(([key, value]) => ` data-track-${key}="${escapeHtml(String(value))}"`).join("");
}

if (typeof module !== "undefined") module.exports = { trackAttrs };
