/**
 * Página: CONTROLE do mural (ferramenta interna, fora do nav/sitemap, sem versão /DEV/; abra no celular do moderador). Raiz de composição: só liga as peças (regras puras, repository do moderador,
 * cenas que podem ser fixadas, frases prontas), sem regra de negócio.
 */
function initMuralControlePage() {
  initMuralControlPanel(document.getElementById("modBody"), {
    repository: window.moderationMuralControlRepository,
    rules: { normalize: normalizeControl, addNotice, removeNotice, holdScene, releaseHold, armEmergency, disarmEmergency, orderReload },
    limits: muralConfigRepository.getAll().control,
    scenes: muralScenesRepository.options(),
    templates: muralNoticeTemplatesRepository.getAll(),
    formatTime: date => formatEventTime(date, EVENT.timezone),
  });
}

runAfterModules(initMuralControlePage);
