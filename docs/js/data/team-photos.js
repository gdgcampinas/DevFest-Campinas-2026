/**
 * Fotos do time em ação — MOCK: reaproveita fotos reais da última
 * edição (highlightPhoto, data/highlights.js) até termos as do time.
 * Mesmo formato de HIGHLIGHTS; reusa a mesma feature de galeria
 * (renderHighlights), só com dado diferente — sem duplicar código de
 * grid/modal. Precisa carregar depois de highlights.js.
 */
const TEAM_PHOTOS = {
  title: "Fotos",
  photos: [3, 6, 9, 12, 15, 16].map(highlightPhoto),
};

const teamPhotosRepository = createRepository(TEAM_PHOTOS);
