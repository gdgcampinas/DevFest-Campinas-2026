/**
 * Página: Créditos do Google Cloud (features/gcp-credits.js). Só em DEV até `public: true` em data/gcp-credits.js: fora do DEV quem cair
 * direto na URL vê o aviso "em breve" (renderOrConstruction, features/reveal-gate.js). `?demo=2026-11-28T10:00` simula a hora (o link só aparece dentro da janela).
 * As telas dos passos ampliam ao toque (features/image-zoom.js).
 */
function initCreditosPage() {
  initShell("creditos");
  const config = gcpCreditsRepository.getAll();
  const sectionEl = document.getElementById("creditSection");
  const session = parallelSessionsRepository.getById(config.sessionId);
  renderOrConstruction(config.public || isDevModeStored(), sectionEl,
    () => {
      renderGcpCredits(config, sectionEl, {
        session,
        host: resolveParallelHost(session, name => sponsorsRepository.findByName(name)),
        parallelTexts: parallelSessionsRepository.texts(),
        now: resolveNow()(),
        locale: i18n.lang === "en" ? "en-US" : "pt-BR",
      });
      initImageZoom({ rootEl: sectionEl, label: config.texts.zoomLabel });
    },
    t("credits.soon", "Os créditos do Google Cloud serão liberados em breve."));
}

initCreditosPage();
