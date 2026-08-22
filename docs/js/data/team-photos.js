/**
 * Fotos do time em ação — MOCK até termos fotos reais. Mesmo formato
 * de HIGHLIGHTS (data/highlights.js); reusa a mesma feature de galeria
 * (renderHighlights), só com dado diferente — sem duplicar código de
 * grid/modal.
 */
const TEAM_PHOTOS = {
  title: "Fotos",
  photos: [
    { file: placeholderImage("Foto do time 1 — exemplo", 640, 420), alt: "Foto exemplo 1 do time" },
    { file: placeholderImage("Foto do time 2 — exemplo", 640, 420), alt: "Foto exemplo 2 do time" },
  ],
};
