/**
 * Avaliação do evento inteiro (fim de dia): nota geral, aspectos (nota 1-5
 * cada), indicação de 0 a 10 e nome; só os textos são opcionais. Puro template; a lista de
 * perguntas vem de data/event-feedback-form.js (parâmetro `form`). Fases:
 *   "closed" → o evento ainda não terminou
 *   "rate"   → formulário
 *   "done"   → já avaliou
 * Atributos `data-event-feedback-*` (nunca `data-feedback-*`) pra o listener
 * de features/event-feedback.js nunca disputar clique/submit com o de
 * features/talk-feedback.js, mesmo os dois no mesmo `document.body`.
 */
function eventFeedbackMarkup({ phase, form, message = "", name = "" }) {
  if (phase === "closed") {
    return `<div class="talk-feedback talk-feedback--waiting">${iconMarkup("clock")}A avaliação do evento abre quando o DevFest terminar.</div>`;
  }

  if (phase === "rate") {
    const aspects = form.aspects
      .map(aspect => `<div class="aspect-row"><span class="aspect-label">${aspect.label}</span>${starRatingMarkup({ name: `aspect-${aspect.id}`, label: aspect.label, required: true })}</div>`)
      .join("");
    return `<form class="talk-feedback feedback-form" data-event-feedback-form>
      <p class="talk-feedback-title">${iconMarkup("star")}O que achou do evento?</p>
      <p class="talk-feedback-hint">Sua nota ajuda a organização a melhorar a próxima edição.</p>
      <p class="feedback-question">Nota geral</p>
      ${starRatingMarkup({ name: "event-rating", label: "Nota geral de 1 a 5", required: true })}
      <p class="feedback-question">Como foi cada parte</p>
      <div class="aspect-list">${aspects}</div>
      <p class="feedback-question">${form.nps.question}</p>
      ${npsScaleMarkup({ name: "event-nps", required: true, ...form.nps })}
      <input type="text" class="feedback-input" name="name" value="${escapeHtml(name)}" placeholder="Seu nome" maxlength="79" autocomplete="name" required>
      <textarea class="feedback-input" name="highlight" placeholder="O que mais gostou? (opcional)" maxlength="399" rows="2"></textarea>
      <textarea class="feedback-input" name="improve" placeholder="O que poderia melhorar? (opcional)" maxlength="399" rows="2"></textarea>
      ${message ? `<p class="talk-feedback-error" role="alert">${message}</p>` : ""}
      <button type="submit" class="chip-btn chip-btn--primary" data-track-event="event_feedback">${iconMarkup("check")}Enviar avaliação</button>
    </form>`;
  }

  return `<div class="talk-feedback talk-feedback--done">${iconMarkup("check")}Obrigado pela avaliação! Até a próxima edição 🎉</div>`;
}
