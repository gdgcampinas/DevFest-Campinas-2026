/**
 * Campos de nota reutilizáveis (feedback de palestra e do evento): estrelas
 * 1-5 e escala 0-10. Só template. `name` precisa ser único por formulário
 * (várias palestras podem estar abertas na mesma tela).
 * As estrelas já vêm com `defaultValue` marcada (5 cheias): quem quer uma
 * nota menor clica numa estrela anterior e as seguintes esvaziam (o
 * preenchimento "até a marcada" é só CSS, ver .feedback-star em styles.css).
 */
function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function starRatingMarkup({ name, label, required = false, defaultValue = 5 }) {
  const stars = [1, 2, 3, 4, 5]
    .map(n => `<label class="feedback-star" title="${t("rating.of5", "{n} de 5", { n })}"><input type="radio" name="${name}" value="${n}"${required ? " required" : ""}${n === defaultValue ? " checked" : ""}><span>★</span></label>`)
    .join("");
  return `<div class="feedback-stars" role="radiogroup" aria-label="${label}">${stars}</div>`;
}

function npsScaleMarkup({ name, min, max, lowLabel, highLabel, required = false }) {
  const options = Array.from({ length: max - min + 1 }, (_, offset) => min + offset)
    .map(value => `<label class="nps-option"><input type="radio" name="${name}" value="${value}"${required ? " required" : ""}><span>${value}</span></label>`)
    .join("");
  return `<div class="nps-scale" role="radiogroup" aria-label="${t("rating.scale", "Nota de {min} a {max}", { min, max })}">${options}</div>
    <div class="nps-labels"><span>${lowLabel}</span><span>${highLabel}</span></div>`;
}
