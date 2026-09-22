/**
 * Bloco de check-in + avaliação dentro do modal de palestra. Puro
 * template — recebe o estado já resolvido (features/talk-feedback.js
 * decide o estado, isso aqui só desenha). Uma função, um `phase`:
 *   "loading"  → aguardando resposta do Firestore
 *   "checkin"  → ainda não fez check-in nessa palestra
 *   "waiting"  → check-in feito, palestra ainda não terminou
 *   "rate"     → pode avaliar (check-in feito + palestra terminada)
 *   "done"     → já avaliou
 * `entryKey` vai em todo elemento interativo via data-attribute, pra
 * o handler delegado (features/talk-feedback.js) saber qual palestra.
 */
function talkFeedbackMarkup({ phase, entryKey, checkinUrl = "" }) {
  if (phase === "loading") {
    return `<div class="talk-feedback talk-feedback--loading">Carregando…</div>`;
  }

  if (phase === "checkin") {
    return `<div class="talk-feedback">
      <p class="talk-feedback-hint">Escaneie o QR code da sala pra fazer check-in e liberar a avaliação no fim da palestra.</p>
      <button type="button" class="chip-btn" data-feedback-checkin data-entry-key="${entryKey}" data-track-event="checkin" data-track-target="${entryKey}">${iconMarkup("check")}Já estou na sala, fazer check-in</button>
    </div>`;
  }

  if (phase === "waiting") {
    return `<div class="talk-feedback talk-feedback--waiting">${iconMarkup("check")}Check-in feito. A avaliação libera quando a palestra terminar.</div>`;
  }

  if (phase === "rate") {
    const stars = [1, 2, 3, 4, 5]
      .map(n => `<label class="feedback-star"><input type="radio" name="rating-${entryKey}" value="${n}" required><span>★</span></label>`)
      .join("");
    return `<form class="talk-feedback feedback-form" data-feedback-form data-entry-key="${entryKey}">
      <p class="talk-feedback-hint">Você esteve aqui — conta pra gente o que achou:</p>
      <div class="feedback-stars" role="radiogroup" aria-label="Nota de 1 a 5">${stars}</div>
      <input type="text" class="feedback-input" name="name" placeholder="Seu nome (opcional)" maxlength="79">
      <textarea class="feedback-input" name="highlight" placeholder="O que mais gostou? (opcional)" maxlength="399" rows="2"></textarea>
      <button type="submit" class="chip-btn chip-btn--primary" data-track-event="talk_feedback" data-track-target="${entryKey}">${iconMarkup("check")}Enviar avaliação</button>
    </form>`;
  }

  return `<div class="talk-feedback talk-feedback--done">${iconMarkup("check")}Obrigado pela avaliação! 🎉</div>`;
}
