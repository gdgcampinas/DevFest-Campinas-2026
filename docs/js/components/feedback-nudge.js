/** Barra fixa "avalie": lembra de avaliar a última palestra terminada (e o evento, no fim). Puro template. */
function feedbackNudgeMarkup({ title = "", more = 0, eventPending = false }) {
  const text = title
    ? `${t("nudge.rate", "Avalie “{title}”", { title })}${more ? ` ${t("nudge.more", "e mais {count}", { count: more })}` : ""}`
    : t("nudge.event", "Conte como foi o DevFest Campinas");
  return `<div class="feedback-nudge-row">
    <span class="feedback-nudge-text">${iconMarkup("star")}${text}${title && eventPending ? ` · ${t("nudge.andEvent", "e o evento")}` : ""}</span>
    <button type="button" class="chip-btn chip-btn--primary" data-nudge-open>${t("common.rate", "Avaliar")}</button>
    <button type="button" class="feedback-nudge-dismiss" data-nudge-dismiss aria-label="${t("common.notNow", "Agora não")}">✕</button>
  </div>`;
}
