/**
 * Cena "10 ANOS DE DEVFEST" (`type: "history"`): a história da comunidade (data/history.js) no telão, em quatro jeitos escolhidos por `params.view`:
 *   mosaico   (padrão) uma página de fotos por passada, só equilibradas (a cena de antes)
 *   evento    uma página de fotos por passada, agrupadas POR EVENTO, com o nome dele no canto ("DevFest 2016")
 *   marco     um marco da linha do tempo em tela cheia por passada (o ano gigante, o título, o texto e a foto; sem foto, o selo "GTUG")
 *   destaque  uma foto grande de evento lotado por passada, em tela cheia, com a legenda
 *   completa  a VOLTA INTEIRA numa passada só, em ordem de ano: cartão do marco, mosaicos e destaques do ano, cada passo no seu tempo (a cena escolhe a própria duração)
 * A próxima página/marco/destaque vem a cada passada (features/mural-rotation.js), então ao longo do dia tudo aparece. As regras puras moram em features/history-story.js e as telas
 * em mural-history-views.js. REGRA do telão: nunca mostra uma foto sozinha; com menos de `minPhotos` fotos carregadas num mosaico a cena some (MURAL_SKIP) e volta quando houver.
 * Tudo injetado: `photos` (historyPhotosRepository), `mosaic` e `highlights` (ids), `milestones` (marcos já liberados), `text` (HISTORY_TEXTS), `years`, `founded`, `perPage`,
 * `tourSeconds` ({ marco, mosaico, destaque }), `rotation`, `preload` (features/image-preload.js) e `minPhotos`.
 */
function createHistoryScene({ photos, mosaic, highlights = [], milestones = [], text, years, founded, perPage = 8, tourSeconds = { marco: 9, mosaico: 9, destaque: 7 }, rotation, preload, minPhotos = 4 }) {
  const all = mosaic.map(id => photos.getById(id)).filter(Boolean);
  const eventPages = historyPages(historyEventGroups(all, { minPhotos, moreLabel: text.storyMore }), perPage);
  const flatPages = balancedChunks(all, perPage).map(list => ({ label: "", year: HISTORY_UNDATED_YEAR, photos: list }));
  const marcos = milestones.map(item => ({ milestone: item.milestone, photo: item.photo ?? null }));
  const destaques = highlights.map(id => photos.getById(id)).filter(Boolean);
  const loadAll = async files => (await Promise.all(files.map(file => preload(file).then(() => file, () => null)))).filter(Boolean);
  const mosaicView = page => historyMosaicViewMarkup({ photos: page.photos, label: page.label, text, years, founded });
  const renderStep = step => ({
    marco: () => historyMarcoViewMarkup({ ...step.item, years, seconds: step.seconds }),
    mosaico: () => mosaicView(step.page),
    destaque: () => historyDestaqueViewMarkup({ photo: step.photo, seconds: step.seconds }),
  })[step.kind]();

  async function mosaicPass(pages, cursor) {
    if (!pages.length) return MURAL_SKIP;
    const page = pages[rotation.next(cursor, pages.length)];
    const loaded = await Promise.all(page.photos.map(photo => preload(photo.file).then(() => photo, () => null)));
    const ready = loaded.filter(Boolean);
    return ready.length >= minPhotos ? { view: "mosaico", page: { ...page, photos: ready } } : MURAL_SKIP;
  }

  const views = {
    mosaico: () => mosaicPass(flatPages, "history"),
    evento: () => mosaicPass(eventPages, "history-evento"),
    async marco() {
      if (!marcos.length) return MURAL_SKIP;
      const item = marcos[rotation.next("history-marco", marcos.length)];
      if (item.photo) await preload(item.photo.file).catch(() => {});
      return { view: "marco", item };
    },
    async destaque() {
      if (!destaques.length) return MURAL_SKIP;
      const photo = destaques[rotation.next("history-destaque", destaques.length)];
      try { await preload(photo.hd ?? photo.file); } catch { return MURAL_SKIP; }
      return { view: "destaque", photo };
    },
    async completa() {
      const steps = historyTourSteps({ milestones: marcos.map(item => ({ milestone: item.milestone, photo: item.photo })), pages: eventPages, highlights: destaques, seconds: tourSeconds });
      if (!steps.length) return MURAL_SKIP;
      await loadAll(historyStepFiles(steps[0]));
      return { view: "completa", steps };
    },
  };

  return {
    prepare: (params = {}) => (views[params.view ?? "mosaico"] ?? views.mosaico)(),
    render(prepared) {
      if (prepared.view === "mosaico") return { markup: mosaicView(prepared.page) };
      if (prepared.view === "marco") return { markup: historyMarcoViewMarkup({ ...prepared.item, years }) };
      if (prepared.view === "destaque") return { markup: historyDestaqueViewMarkup({ photo: prepared.photo }) };
      const { steps } = prepared;
      return {
        markup: `<div class="ms-history-tour" data-step="0">${renderStep(steps[0])}</div>`,
        seconds: steps.reduce((sum, step) => sum + step.seconds, 0),
        mount(el, deps) {
          const stage = el.querySelector(".ms-history-tour");
          let index = 0;
          let cancel = () => {};
          const next = () => {
            index += 1;
            if (index >= steps.length) return;
            const files = historyStepFiles(steps[index]);
            Promise.all(files.map(file => preload(file).catch(() => null))).then(() => {
              stage.innerHTML = renderStep(steps[index]);
              stage.dataset.step = String(index);
              wait();
            });
          };
          const wait = () => { cancel = deps.schedule(next, steps[index].seconds * 1000); };
          wait();
          if (steps[1]) Promise.all(historyStepFiles(steps[1]).map(file => preload(file).catch(() => null))); // já deixa o 2º passo pronto
          return () => cancel();
        },
      };
    },
  };
}
