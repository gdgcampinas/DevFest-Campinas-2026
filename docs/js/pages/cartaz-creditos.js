/** Página interna: cartaz A4 dos créditos do Google Cloud (features/gcp-credit-poster.js). `?janela=night` escolhe a janela da noite; sem parâmetro, a primeira. */
function initCartazCreditos() {
  const params = new URLSearchParams(location.search);
  const config = gcpCreditsRepository.getAll();
  const siteUrl = `${location.host}${location.pathname.replace(/[^/]*$/, "")}creditos.html`;
  renderGcpPoster(config, document.getElementById("poster"), { session: parallelSessionsRepository.getById(config.sessionId), windowId: params.get("janela"), siteUrl });
}

initCartazCreditos();
