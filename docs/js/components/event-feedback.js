/**
 * Bloco de avaliação do evento inteiro (fim de dia), mostrado no hero
 * "Encerrado" da home (features/live-status.js). Mesmo visual de
 * components/talk-feedback.js, sem a fase de check-in — aqui não tem
 * gate de presença, qualquer visitante pode avaliar o evento uma vez:
 *   "loading" → aguardando resposta do Firestore
 *   "rate"    → formulário de nota + comentário opcional
 *   "done"    → já avaliou
 * Atributos com prefixo `data-event-feedback-*` (em vez de
 * `data-feedback-*`, usado por talk-feedback.js) pra o listener
 * delegado de features/event-feedback.js nunca disputar clique/submit
 * com o de features/talk-feedback.js, mesmo os dois ligados no mesmo
 * `document.body`.
 */
function eventFeedbackMarkup({ phase }) {
  if (phase === "loading") {
    return `<div class="talk-feedback talk-feedback--loading">Carregando…</div>`;
  }

  if (phase === "rate") {
    const stars = [1, 2, 3, 4, 5]
      .map(n => `<label class="feedback-star"><input type="radio" name="event-rating" value="${n}" required><span>★</span></label>`)
      .join("");
    return `<form class="talk-feedback feedback-form" data-event-feedback-form>
      <p class="talk-feedback-title">${iconMarkup("star")}O que achou do evento?</p>
      <p class="talk-feedback-hint">Sua nota ajuda a organização a melhorar a próxima edição.</p>
      <div class="feedback-stars" role="radiogroup" aria-label="Nota de 1 a 5">${stars}</div>
      <input type="text" class="feedback-input" name="name" placeholder="Seu nome (opcional)" maxlength="79">
      <textarea class="feedback-input" name="highlight" placeholder="O que mais gostou? (opcional)" maxlength="399" rows="2"></textarea>
      <button type="submit" class="chip-btn chip-btn--primary" data-track-event="event_feedback">${iconMarkup("check")}Enviar avaliação</button>
    </form>`;
  }

  return `<div class="talk-feedback talk-feedback--done">${iconMarkup("check")}Obrigado pela avaliação! Até a próxima edição 🎉</div>`;
}
