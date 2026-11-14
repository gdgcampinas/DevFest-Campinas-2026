/**
 * Bloco do link de crédito (data/gcp-credits.js): QR e botão do link que está valendo, o link reserva escondido atrás de "Deu problema?",
 * ou a mensagem de "ainda não abriu" / "encerrou". Puro template: recebe o estado (features/gcp-credit-window.js) e as frases já prontas.
 *   state    { state, window }   texts  data/gcp-credits.js `texts`   dateText  "28/11 às 07:00" já formatado (abre em / vale até)
 */
function creditLinkMarkup({ state, texts, dateText }) {
  if (state.state === "before") return `<p class="credit-link-msg">${iconMarkup("clock")}<span>${interpolate(texts.before, { date: dateText })}</span></p>`;
  if (state.state === "closed") return `<p class="credit-link-msg">${iconMarkup("lock")}<span>${texts.closed}</span></p>`;
  const { primary, backup } = state.window;
  return `
    <div class="credit-link-open">
      <img class="credit-qr" src="${primary.qr}" alt="QR ${primary.code}" width="168" height="168" decoding="async">
      <div class="credit-link-body">
        <a class="cta" href="${primary.url}" target="_blank" rel="noopener" data-credit="${primary.code}">${iconMarkup("gift")}${texts.openButton}</a>
        <p class="credit-link-hint">${texts.qrHint}</p>
        <p class="credit-link-until">${interpolate(texts.open, { date: dateText })}</p>
      </div>
    </div>
    <details class="credit-backup">
      <summary>${texts.backupSummary}</summary>
      <p>${texts.backupText}</p>
      <a class="cta cta--ghost" href="${backup.url}" target="_blank" rel="noopener" data-credit="${backup.code}">${texts.backupButton}</a>
    </details>`;
}
