/**
 * Feature: a seção "Nossa história" da página principal (linha do tempo + mosaico de fotos). Só aparece quando liberada (`config.public`, ou no modo DEV: features/release-gate.js).
 * Tudo por parâmetro: `config`, `text`, `milestones`, `mosaic` (ids) e `photos` (repository, data/history.js), o ano do evento e os marcos do selo (data/anniversary.js) pra calcular os anos.
 * Marco ou foto de mosaico com id de foto que não existe fica de fora (o teste de dados barra isso antes).
 */
function initHistory(sectionEl, { config, text, milestones, mosaic, photos, anniversary, eventYear, devMode = false }) {
  const resolve = id => photos.getById(id) ?? null;
  const items = milestones.map(milestone => ({ milestone, photo: resolve(milestone.photo) })).filter(item => item.photo);
  const mosaicPhotos = mosaic.map(resolve).filter(Boolean);
  const visible = isReleased(config, { devMode }) && items.length > 0;
  sectionEl.hidden = !visible;
  sectionEl.innerHTML = visible ? historySectionMarkup({ text, milestones: items, mosaic: mosaicPhotos, years: anniversaryYears({ eventYear, ...anniversary }), galleryVisible: config.galleryVisible }) : "";
  return visible;
}

/** O cartão "Nossa história" da página principal (leva a historia.html). Só aparece quando liberado (`config.public`, ou no modo DEV). Devolve se apareceu. */
function initHistoryTeaser(mountEl, { config, text, anniversary, eventYear, href, devMode = false }) {
  const visible = isReleased(config, { devMode });
  mountEl.hidden = !visible;
  mountEl.innerHTML = visible ? historyTeaserMarkup({ text, years: anniversaryYears({ eventYear, ...anniversary }), href }) : "";
  return visible;
}
