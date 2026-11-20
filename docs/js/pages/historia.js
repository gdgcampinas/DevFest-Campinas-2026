/** Página: Nossa história (features/history.js): linha do tempo e galeria de fotos da comunidade. Só em DEV até `HISTORY_CONFIG.public` (data/history-config.js); antes disso quem cair na URL vê "chega em breve". */
function initHistoriaPage() {
  initShell("historia");
  const text = historyTextsRepository.getAll();
  const sectionEl = document.getElementById("historySection");
  const shown = initHistory(sectionEl, {
    config: historyConfigRepository.getAll(), text, milestones: historyMilestonesRepository.getAll(), mosaic: historyMosaicRepository.getAll(), photos: historyPhotosRepository,
    anniversary: anniversaryConfigRepository.getAll(), eventYear: Number(EVENT.date.slice(0, 4)), devMode: isDevModeStored(),
  });
  if (!shown) {
    sectionEl.hidden = false;
    sectionEl.innerHTML = historySoonMarkup(text);
  }
}

initHistoriaPage();
