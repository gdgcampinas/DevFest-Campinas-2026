/** Barra fixa "avalie": lembra de avaliar a última palestra terminada (e o evento, no fim). Puro template. */
function feedbackNudgeMarkup({ title = "", more = 0, eventPending = false }) {
  const text = title
    ? `Avalie “${title}”${more ? ` e mais ${more}` : ""}`
    : "Conte como foi o DevFest Campinas";
  return `<div class="feedback-nudge-row">
    <span class="feedback-nudge-text">${iconMarkup("star")}${text}${title && eventPending ? " · e o evento" : ""}</span>
    <button type="button" class="chip-btn chip-btn--primary" data-nudge-open>Avaliar</button>
    <button type="button" class="feedback-nudge-dismiss" data-nudge-dismiss aria-label="Agora não">✕</button>
  </div>`;
}
