/**
 * Página: Créditos do Google Cloud (features/gcp-credits.js). Só em DEV até `public: true` em data/gcp-credits.js: fora do DEV quem cair
 * direto na URL vê o aviso "em breve" (renderOrConstruction, features/reveal-gate.js). `?demo=2026-11-28T10:00` simula a hora (o link só aparece dentro da janela).
 */
function initCreditosPage() {
  initShell("creditos");
  const config = gcpCreditsRepository.getAll();
  renderOrConstruction(config.public || isDevModeStored(), document.getElementById("creditSection"),
    () => renderGcpCredits(config, document.getElementById("creditSection"), { session: parallelSessionsRepository.getById(config.sessionId), now: resolveNow()(), locale: i18n.lang === "en" ? "en-US" : "pt-BR" }),
    t("credits.soon", "Os créditos do Google Cloud serão liberados em breve."));
}

initCreditosPage();
