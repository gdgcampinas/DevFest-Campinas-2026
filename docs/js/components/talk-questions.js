/**
 * Templates das perguntas ao vivo por palestra: bloco do modal (plateia) e
 * item da tela do moderador. Só markup: features/talk-questions.js e
 * features/question-moderation.js decidem estado e cliques. Nome e texto
 * digitados pela plateia passam sempre por escapeHtml.
 */
function questionItemMarkup(question, { moderator = false } = {}) {
  const classes = ["question-item", question.hidden ? "is-hidden" : "", question.mine ? "is-mine" : ""].filter(Boolean).join(" ");
  const votes = `<span class="question-votes" aria-label="${tn("q.votes", question.votes, "{count} voto", "{count} votos")}">${question.votes}</span>`;
  const action = moderator
    ? `<button type="button" class="chip-btn" data-question-hide="${escapeHtml(question.id)}" data-hidden="${question.hidden ? "0" : "1"}">${question.hidden ? "Mostrar" : "Ocultar"}</button>`
    : `<button type="button" class="chip-btn question-vote" data-question-vote="${escapeHtml(question.id)}" aria-pressed="${question.voted}"${question.voted || question.mine ? " disabled" : ""}>${iconMarkup("thumbs-up")}${question.voted ? t("q.voted", "Votado") : t("q.vote", "Votar")}</button>`;
  return `<li class="${classes}">
    ${votes}
    <div class="question-body"><p class="question-text">${escapeHtml(question.text)}</p><p class="question-author">${escapeHtml(question.name)}${question.mine ? ` (${t("q.you", "você")})` : ""}</p></div>
    ${action}
  </li>`;
}

function questionListMarkup(questions, opts) {
  return `<ul class="question-list">${questions.map(question => questionItemMarkup(question, opts)).join("")}</ul>`;
}

/**
 * Fases: "locked" (sem check-in), "loading", "ready" (lista + formulário se ainda
 * não perguntou), "error". `entryKey` é a palestra; `message` um aviso de erro opcional.
 */
function talkQuestionsMarkup({ phase, entryKey, questions = [], canAsk = false, name = "", message = "", maxLength }) {
  const title = `<p class="talk-feedback-title">${iconMarkup("mic")}${t("q.title", "Perguntas pro palestrante")}</p>`;
  if (phase === "locked") return `<div class="talk-feedback">${title}<p class="talk-feedback-hint">${t("q.locked", "Faça o check-in nessa palestra pra enviar e votar perguntas.")}</p></div>`;
  if (phase === "loading") return `<div class="talk-feedback talk-feedback--loading">${title}${t("q.loading", "Carregando perguntas…")}</div>`;
  if (phase === "error") return `<div class="talk-feedback">${title}<p class="talk-feedback-error" role="alert">${message}</p></div>`;

  const form = canAsk
    ? `<form class="feedback-form question-form" data-question-form data-entry-key="${entryKey}">
        <textarea class="feedback-input" name="text" placeholder="${t("q.placeholder", "Sua pergunta")}" maxlength="${maxLength - 1}" rows="2" required></textarea>
        <input type="text" class="feedback-input" name="name" value="${escapeHtml(name)}" placeholder="${t("fb.name", "Seu nome")}" maxlength="79" autocomplete="name" required>
        ${message ? `<p class="talk-feedback-error" role="alert">${message}</p>` : ""}
        <button type="submit" class="chip-btn chip-btn--primary" data-track-event="question_send" data-track-target="${entryKey}">${iconMarkup("check")}${t("q.send", "Enviar pergunta")}</button>
      </form>`
    : `<p class="talk-feedback-hint">${t("q.alreadyAsked", "Você já enviou sua pergunta. Vote nas outras!")}</p>`;
  const list = questions.length ? questionListMarkup(questions) : `<p class="talk-feedback-hint">${t("q.empty", "Ninguém perguntou ainda. Seja a primeira pessoa!")}</p>`;
  return `<div class="talk-feedback">${title}${form}${list}</div>`;
}

/**
 * Tela do moderador (tablet da sala): palestra atual, perguntas mais votadas primeiro
 * e "Ocultar/Mostrar". `phase`: "signin" (falta entrar com Google), "empty" (sem
 * palestra agora), "ready", "error". `email` é a conta logada, quando há.
 */
function questionModerationMarkup({ phase, trackLabel, talkTitle = "", questions = [], email = "", message = "" }) {
  const head = `<h1 class="mod-title">${escapeHtml(trackLabel)}</h1>`;
  if (phase === "signin") {
    return `${head}<p class="mod-hint">${message || "Entre com a conta de moderador pra ver e moderar as perguntas."}</p>
      <button type="button" class="chip-btn chip-btn--primary" data-mod-signin>Entrar com Google</button>`;
  }
  const account = `<p class="mod-account">${escapeHtml(email)} <button type="button" class="chip-btn" data-mod-signout>Sair</button></p>`;
  if (phase === "empty") return `${head}${account}<p class="mod-hint">${message}</p>`;
  if (phase === "error") return `${head}${account}<p class="talk-feedback-error" role="alert">${message}</p>`;
  return `${head}${account}<h2 class="mod-talk">${escapeHtml(talkTitle)}</h2>
    ${questions.length ? questionListMarkup(questions, { moderator: true }) : `<p class="mod-hint">Nenhuma pergunta ainda.</p>`}`;
}
