/**
 * Feature: a seção "Nossa história" da página principal (linha do tempo + mosaico de fotos). Só aparece quando liberada (`config.public`, ou no modo DEV: features/release-gate.js). O acervo novo (`archive: true`) segue `config.archivePublic` do mesmo jeito.
 * Tudo por parâmetro: `config`, `text`, `milestones`, `mosaic` (ids) e `photos` (repository, data/history.js), o ano do evento e os marcos do selo (data/anniversary.js) pra calcular os anos.
 * Marco sem foto precisa de `badge` (o selo em texto no lugar da foto); marco ou foto de mosaico com id de foto que não existe fica de fora (o teste de dados barra isso antes).
 */
/**
 * Liga os botões do filtro da galeria: escolher um tipo mostra só as fotos dele, todas juntas na mesma grade (as do "Ver todas" sobem pra grade principal e o botão some);
 * "Todas" devolve cada foto ao lugar de antes.
 */
function bindHistoryFilter(sectionEl) {
  const chips = sectionEl.querySelectorAll(".history-chip");
  const mainGrid = sectionEl.querySelector(":scope > .history-mosaic");
  const extraGrid = sectionEl.querySelector(".history-more .history-mosaic");
  const extras = extraGrid ? Array.from(extraGrid.children) : [];
  chips.forEach(chip => chip.addEventListener("click", () => {
    const filter = chip.dataset.filter;
    const filtered = filter !== "all";
    chips.forEach(other => { const active = other === chip; other.classList.toggle("is-active", active); other.setAttribute("aria-pressed", String(active)); });
    extras.forEach(figure => (filtered ? mainGrid : extraGrid).append(figure));
    sectionEl.querySelectorAll(".history-mosaic figure").forEach(figure => { figure.hidden = filtered && figure.dataset.kind !== filter; });
    sectionEl.classList.toggle("is-filtered", filtered);
  }));
}

function initHistory(sectionEl, { config, text, milestones, mosaic, photos, anniversary, eventYear, devMode = false }) {
  const showArchive = isReleased({ public: config.archivePublic }, { devMode });
  const resolve = id => photos.getById(id) ?? null;
  const items = historyMilestoneItems({ milestones, resolve, showArchive });
  const mosaicPhotos = mosaic.map(resolve).filter(photo => photo && historyReleased(photo, showArchive));
  const visible = isReleased(config, { devMode }) && items.length > 0;
  sectionEl.hidden = !visible;
  sectionEl.innerHTML = visible ? historySectionMarkup({ text, milestones: items, mosaic: mosaicPhotos, years: anniversaryYears({ eventYear, ...anniversary }), galleryVisible: config.galleryVisible }) : "";
  if (visible) bindHistoryFilter(sectionEl);
  return visible;
}

/** O cartão "Nossa história" da página principal (leva a historia.html). Só aparece quando liberado (`config.public`, ou no modo DEV). Devolve se apareceu. */
function initHistoryTeaser(mountEl, { config, text, anniversary, eventYear, href, devMode = false }) {
  const visible = isReleased(config, { devMode });
  mountEl.hidden = !visible;
  mountEl.innerHTML = visible ? historyTeaserMarkup({ text, years: anniversaryYears({ eventYear, ...anniversary }), href }) : "";
  return visible;
}
