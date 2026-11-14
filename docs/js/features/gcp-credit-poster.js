/**
 * Feature: cartaz A4 dos créditos do Google Cloud (cartaz-creditos.html), para imprimir e colar na porta do laboratório. Lê tudo de GCP_CREDITS
 * (data/gcp-credits.js): QR da janela escolhida (`windowId`, padrão a primeira), as regras, o passo a passo compacto (components/credit-steps.js).
 * Diferente da página, o cartaz mostra o QR da janela mesmo fora do horário: a folha é impressa antes e só funciona dentro da janela.
 */
function renderGcpPoster(config, mountEl, { windowId = null, siteUrl = "" } = {}) {
  const { texts, session } = config;
  const window = config.windows.find(candidate => candidate.id === windowId) ?? config.windows[0];
  const rounds = session.rounds.map((round, index) => interpolate(texts.roundLine, { n: index + 1, start: round.start, end: round.end })).join(" · ");
  mountEl.innerHTML = `
    <article class="credit-poster">
      <div class="credit-poster-head">
        <div>
          <h1>${texts.posterTitle}</h1>
          <p class="credit-poster-session">${session.name} · ${session.place} · ${rounds}</p>
        </div>
        <div class="credit-poster-qr">
          <img src="${window.primary.qr}" alt="QR ${window.primary.code}">
          <span>${texts.posterScan}</span>
        </div>
      </div>
      <ul class="credit-poster-rules">${config.requirements.map(rule => `<li><b>${rule.title}.</b> ${rule.body}</li>`).join("")}</ul>
      ${creditStepsMarkup(config.steps, { compact: true })}
      <div class="credit-poster-foot"><span>${texts.posterBackup}</span><span>${texts.posterSite}: ${siteUrl}</span></div>
    </article>
    <button class="cta credit-poster-print" type="button" onclick="window.print()">${iconMarkup("download")}Imprimir</button>`;
}
