/**
 * Campos de nota reutilizáveis (feedback de palestra e do evento): estrelas
 * 1-5 e escala 0-10. Só template. `name` precisa ser único por formulário
 * (várias palestras podem estar abertas na mesma tela).
 */
function starRatingMarkup({ name, label, required = false }) {
  const stars = [1, 2, 3, 4, 5]
    .map(n => `<label class="feedback-star"><input type="radio" name="${name}" value="${n}"${required ? " required" : ""}><span>★</span></label>`)
    .join("");
  return `<div class="feedback-stars" role="radiogroup" aria-label="${label}">${stars}</div>`;
}

function npsScaleMarkup({ name, min, max, lowLabel, highLabel }) {
  const options = Array.from({ length: max - min + 1 }, (_, offset) => min + offset)
    .map(value => `<label class="nps-option"><input type="radio" name="${name}" value="${value}"><span>${value}</span></label>`)
    .join("");
  return `<div class="nps-scale" role="radiogroup" aria-label="Nota de ${min} a ${max}">${options}</div>
    <div class="nps-labels"><span>${lowLabel}</span><span>${highLabel}</span></div>`;
}
