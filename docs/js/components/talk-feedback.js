/**
 * Bloco de check-in + avaliação dentro do modal de palestra e da tela
 * "Minhas palestras". Puro template — recebe o estado já resolvido
 * (features/talk-feedback.js decide o estado, isso aqui só desenha). Fases:
 *   "checkin"         → ainda não fez check-in nessa palestra
 *   "checkin-before"  → o check-in ainda não abriu (abre `leadMinutes` antes da palestra; só com a trava de horário ligada)
 *   "checkin-closed"  → o check-in já fechou (passou da janela)
 *   "checkin-confirm" → confirmação inline antes de gravar (sem diálogo nativo do navegador)
 *   "waiting"         → check-in feito (ou sessão sem check-in, `checkedIn` falso), palestra ainda não terminou
 *   "rate"            → pode avaliar (check-in feito + palestra terminada)
 *   "done"            → já avaliou
 * `entryKey` vai em todo elemento interativo via data-attribute, pra o
 * handler delegado saber qual palestra. `message` é um aviso de erro opcional;
 * `name` pré-preenche o nome (obrigatório) com o da última avaliação.
 */
function talkFeedbackMarkup({ phase, entryKey, title = "", message = "", name = "", invite = "", photoInvite = "", checkedIn = true, leadMinutes = 0 }) {
  const note = message ? `<p class="form-error" role="alert">${message}</p>` : "";

  if (phase === "checkin") {
    return `<div class="talk-feedback">
      <p class="talk-feedback-title">${iconMarkup("mic")}${t("checkin.title", "Check-in dessa palestra")}</p>
      <p class="talk-feedback-hint">${t("checkin.hint", "Quando estiver na sala, toque no botão abaixo. Isso libera as perguntas e a avaliação no fim da palestra.")}</p>
      ${note}
      <button type="button" class="chip-btn chip-btn--primary" data-feedback-checkin data-entry-key="${entryKey}" data-track-event="checkin" data-track-target="${entryKey}">${iconMarkup("check")}${t("checkin.button", "Já estou na sala, fazer check-in")}</button>
    </div>`;
  }

  if (phase === "checkin-before" || phase === "checkin-closed") {
    const text = phase === "checkin-before"
      ? t("checkin.before", "O check-in abre {n} minutos antes da palestra.", { n: leadMinutes })
      : t("checkin.closed", "O check-in dessa palestra já encerrou.");
    return `<div class="talk-feedback talk-feedback--waiting">${iconMarkup("clock")}${text}</div>`;
  }

  if (phase === "checkin-confirm") {
    return `<div class="talk-feedback">
      <p class="talk-feedback-title">${iconMarkup("mic")}${t("checkin.confirmTitle", "Confirmar check-in")}</p>
      <p class="talk-feedback-hint">${t("checkin.confirmText", "Confirma o check-in em {title}?", { title: `<strong>“${title}”</strong>` })}</p>
      <div class="talk-feedback-actions">
        <button type="button" class="chip-btn chip-btn--primary" data-feedback-checkin-confirm data-entry-key="${entryKey}">${iconMarkup("check")}${t("checkin.confirmTitle", "Confirmar check-in")}</button>
        <button type="button" class="chip-btn" data-feedback-checkin-cancel data-entry-key="${entryKey}">${t("common.cancel", "Cancelar")}</button>
      </div>
    </div>`;
  }

  if (phase === "waiting") {
    const text = checkedIn ? t("checkin.done", "Check-in feito. A avaliação libera quando a palestra terminar.") : t("rate.opensAtEnd", "A avaliação libera quando a sessão terminar.");
    return `<div class="talk-feedback talk-feedback--waiting">${iconMarkup("check")}${text}${checkedIn ? photoInvite : ""}</div>`;
  }

  if (phase === "rate") {
    return `<form class="talk-feedback feedback-form" data-feedback-form data-entry-key="${entryKey}">
      <p class="talk-feedback-title">${iconMarkup("mic")}${t("rate.title", "Avaliar essa palestra")}</p>
      <p class="talk-feedback-hint">${t("rate.hint", "Você esteve aqui, conta pra gente o que achou:")}</p>
      ${starRatingMarkup({ name: `rating-${entryKey}`, label: t("rate.stars", "Nota de 1 a 5"), required: true })}
      <input type="text" class="feedback-input" name="name" value="${escapeHtml(name)}" placeholder="${t("fb.name", "Seu nome")}" maxlength="79" autocomplete="name" required>
      <textarea class="feedback-input" name="highlight" placeholder="${t("fb.highlight", "O que mais gostou? (opcional)")}" maxlength="399" rows="2"></textarea>
      <textarea class="feedback-input" name="improve" placeholder="${t("fb.improve", "O que poderia melhorar? (opcional)")}" maxlength="399" rows="2"></textarea>
      ${note}
      <button type="submit" class="chip-btn chip-btn--primary" data-track-event="talk_feedback" data-track-target="${entryKey}">${iconMarkup("check")}${t("fb.send", "Enviar avaliação")}</button>
    </form>`;
  }

  return `<div class="talk-feedback talk-feedback--done">${iconMarkup("check")}${t("rate.thanks", "Obrigado pela avaliação! 🎉")}${invite}</div>`;
}
