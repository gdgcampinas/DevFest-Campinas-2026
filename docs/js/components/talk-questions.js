/**
 * Templates das perguntas ao vivo dentro do modal da palestra (plateia). Só markup: features/talk-questions.js
 * decide estado e cliques. Nome e texto digitados passam sempre por escapeHtml. A tela do moderador e o quadro
 * da sala têm os próprios componentes (question-moderation.js, room-board.js) e reusam `questionStatusLabel`.
 */
function questionStatusLabel(status) {
  return {
    pending: t("q.status.pending", "Aguardando o moderador"),
    approved: t("q.status.approved", "Aprovada"),
    answered: t("q.status.answered", "Respondida"),
    rejected: t("q.status.rejected", "Não aprovada"),
  }[status];
}

/** Pergunta aprovada na lista da plateia; `voteEnabled` falso (palestra encerrada) tira o botão. */
function questionItemMarkup(question, { voteEnabled = true } = {}) {
  // O número só existe quando o quadro publica votos (config publishVotes); sem ele a lista mostra só a ordem.
  const hasVotes = typeof question.votes === "number";
  const votes = hasVotes ? `<span class="question-votes" aria-label="${tn("q.votes", question.votes, "{count} voto", "{count} votos")}">${question.votes}</span>` : "";
  const action = voteEnabled
    ? `<button type="button" class="chip-btn question-vote" data-question-vote="${escapeHtml(question.id)}" aria-pressed="${question.voted}"${question.voted || question.mine ? " disabled" : ""}>${iconMarkup("thumbs-up")}${question.voted ? t("q.voted", "Votado") : t("q.vote", "Votar")}</button>`
    : "";
  return `<li class="question-item${question.mine ? " is-mine" : ""}${hasVotes ? "" : " question-item--no-votes"}">
    ${votes}
    <div class="question-body"><p class="question-text">${escapeHtml(question.text)}</p><p class="question-author">${escapeHtml(question.name)}${question.mine ? ` (${t("q.you", "você")})` : ""}</p></div>
    ${action}
  </li>`;
}

/** Pergunta da própria pessoa, com o estado dela ("aguardando o moderador", "aprovada"...). */
function myQuestionMarkup(question) {
  return `<li class="question-item question-item--mine question-item--${question.status}">
    <div class="question-body"><p class="question-text">${escapeHtml(question.text)}</p></div>
    <span class="question-status question-status--${question.status}">${questionStatusLabel(question.status)}</span>
  </li>`;
}

const listMarkup = (items, itemMarkup) => `<ul class="question-list">${items.map(itemMarkup).join("")}</ul>`;

/**
 * Fases: "locked" (sem check-in), "loading", "error", "waiting" (a palestra ainda não começou), "open" (pode perguntar
 * e votar) e "closed" (acabou: só leitura). `approved` e `mine` já vêm ordenadas; `canAsk` e `remaining` dizem se ainda
 * cabe pergunta; `message` é um aviso de erro opcional.
 */
function talkQuestionsMarkup({ phase, entryKey, approved = [], mine = [], canAsk = false, remaining = 0, limit = 1, name = "", message = "", maxLength }) {
  const title = `<p class="talk-feedback-title">${iconMarkup("mic")}${t("q.title", "Perguntas pro palestrante")}</p>`;
  const wrap = body => `<div class="talk-feedback">${title}${body}</div>`;
  if (phase === "locked") return wrap(`<p class="talk-feedback-hint">${t("q.locked", "Faça o check-in nessa palestra pra enviar e votar perguntas.")}</p>`);
  if (phase === "loading") return `<div class="talk-feedback talk-feedback--loading">${title}${t("q.loading", "Carregando perguntas…")}</div>`;
  if (phase === "error") return wrap(`<p class="talk-feedback-error" role="alert">${message}</p>`);
  if (phase === "waiting") return wrap(`<p class="talk-feedback-hint">${t("q.waiting", "As perguntas abrem quando a palestra começar e fecham quando ela terminar.")}</p>`);

  const open = phase === "open";
  const form = !open ? `<p class="talk-feedback-hint">${t("q.closed", "As perguntas foram encerradas com o fim da palestra.")}</p>`
    : canAsk
      ? `<p class="talk-feedback-hint">${t("q.moderated", "O moderador aprova cada pergunta antes de ela aparecer pra todo mundo.")}</p>
        <form class="feedback-form question-form" data-question-form data-entry-key="${entryKey}">
          <textarea class="feedback-input" name="text" placeholder="${t("q.placeholder", "Sua pergunta")}" maxlength="${maxLength - 1}" rows="2" required></textarea>
          <input type="text" class="feedback-input" name="name" value="${escapeHtml(name)}" placeholder="${t("fb.name", "Seu nome")}" maxlength="79" autocomplete="name" required>
          ${message ? `<p class="talk-feedback-error" role="alert">${message}</p>` : ""}
          <button type="submit" class="chip-btn chip-btn--primary" data-track-event="question_send" data-track-target="${entryKey}">${iconMarkup("check")}${t("q.send", "Enviar pergunta")}</button>
          <span class="talk-feedback-hint">${tn("q.remaining", remaining, "Você pode enviar mais {count} pergunta.", "Você pode enviar mais {count} perguntas.")}</span>
        </form>`
      : `<p class="talk-feedback-hint">${t("q.limitReached", "Você já enviou o máximo de {limit} perguntas. Vote nas outras!", { limit })}</p>`;
  const mineBlock = mine.length ? `<p class="feedback-question">${t("q.mine", "Suas perguntas")}</p>${listMarkup(mine, myQuestionMarkup)}` : "";
  const crowd = approved.length
    ? `<p class="feedback-question">${t("q.crowd", "Perguntas da plateia")}</p>${listMarkup(approved, question => questionItemMarkup(question, { voteEnabled: open }))}`
    : `<p class="talk-feedback-hint">${t("q.empty", "Nenhuma pergunta aprovada ainda.")}</p>`;
  return wrap(`${form}${mineBlock}${crowd}`);
}
