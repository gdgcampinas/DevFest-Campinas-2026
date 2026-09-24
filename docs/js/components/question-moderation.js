/**
 * Templates da tela do moderador (tablet da sala, ferramenta interna em português). Só markup: quem decide o
 * que carregar e o que cada botão faz é features/question-moderation.js. Cada estado da pergunta mostra as ações
 * que fazem sentido nele (MODERATION_ACTIONS), então a fila, o que está no ar, as respondidas e as rejeitadas
 * usam o mesmo item.
 */
const MODERATION_ACTIONS = {
  pending: [{ to: "approved", label: "Aprovar", primary: true }, { to: "rejected", label: "Rejeitar" }],
  approved: [{ to: "answered", label: "Respondida", primary: true }, { to: "rejected", label: "Tirar do ar" }],
  answered: [{ to: "approved", label: "Reabrir" }],
  rejected: [{ to: "approved", label: "Aprovar" }],
};

const MODERATION_SECTIONS = [
  { status: "pending", title: "Fila para aprovar", empty: "Nenhuma pergunta esperando." },
  { status: "approved", title: "No ar (aparecem no quadro da sala)", empty: "Nenhuma pergunta no ar." },
  { status: "answered", title: "Respondidas", empty: "" },
  { status: "rejected", title: "Rejeitadas", empty: "" },
];

function moderationItemMarkup(question) {
  const actions = MODERATION_ACTIONS[question.status].map(action =>
    `<button type="button" class="chip-btn${action.primary ? " chip-btn--primary" : ""}" data-question-set="${action.to}" data-question-id="${escapeHtml(question.id)}">${action.label}</button>`).join("");
  return `<li class="question-item question-item--moderation">
    <span class="question-votes" aria-label="${tn("q.votes", question.votes, "{count} voto", "{count} votos")}">${question.votes}</span>
    <div class="question-body"><p class="question-text">${escapeHtml(question.text)}</p><p class="question-author">${escapeHtml(question.name)}</p></div>
    <div class="question-actions">${actions}</div>
  </li>`;
}

function moderationSectionMarkup(section, questions) {
  const items = questions.filter(question => question.status === section.status);
  if (!items.length && !section.empty) return "";
  return `<section class="mod-section"><h3 class="mod-section-title">${section.title} <span class="mod-count">${items.length}</span></h3>
    ${items.length ? `<ul class="question-list">${items.map(moderationItemMarkup).join("")}</ul>` : `<p class="mod-hint">${section.empty}</p>`}</section>`;
}

/**
 * `phase`: "signin" (falta entrar com Google), "empty" (sem palestra agora), "ready" ou "error". `email` é a conta
 * logada, quando há; `talkTitle` a palestra que está sendo moderada.
 */
function questionModerationMarkup({ phase, trackLabel, talkTitle = "", questions = [], email = "", message = "" }) {
  const head = `<h1 class="mod-title">${escapeHtml(trackLabel)}</h1>`;
  if (phase === "signin") {
    return `${head}<p class="mod-hint">${message || "Entre com a conta de moderador pra aprovar as perguntas."}</p>
      <button type="button" class="chip-btn chip-btn--primary" data-mod-signin>Entrar com Google</button>`;
  }
  const account = `<p class="mod-account">${escapeHtml(email)} <button type="button" class="chip-btn" data-mod-signout>Sair</button></p>`;
  if (phase === "empty") return `${head}${account}<p class="mod-hint">${message}</p>`;
  if (phase === "error") return `${head}${account}<p class="talk-feedback-error" role="alert">${message}</p>`;
  return `${head}${account}<h2 class="mod-talk">${escapeHtml(talkTitle)}</h2>${MODERATION_SECTIONS.map(section => moderationSectionMarkup(section, questions)).join("")}`;
}
