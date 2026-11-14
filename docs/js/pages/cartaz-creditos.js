/** Página interna: cartaz A4 dos créditos do Google Cloud (features/gcp-credit-poster.js). `?janela=night` escolhe a janela da noite; sem parâmetro, a primeira. */
function initCartazCreditos() {
  const params = new URLSearchParams(location.search);
  const siteUrl = `${location.host}${location.pathname.replace(/[^/]*$/, "")}creditos.html`;
  renderGcpPoster(gcpCreditsRepository.getAll(), document.getElementById("poster"), { windowId: params.get("janela"), siteUrl });
}

initCartazCreditos();
