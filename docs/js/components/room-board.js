/**
 * Templates do quadro da sala (checkin-display.html), ferramenta interna em português pra TV ou tablet: cabeçalho
 * da palestra ligada à sala e o quadro de perguntas ao vivo. Só markup (os QR ficam em room-panel.js). Texto de
 * palestra e de pergunta passa por escapeHtml.
 */
const pad2 = value => String(value).padStart(2, "0");
const clock = (date, timezone) => formatEventTime(date, timezone, CODE_LOCALE);

/** Palestra da sala: título, quem fala, horário e barra de progresso (só quando está rolando). */
function roomTalkHeaderMarkup({ track, talk, timezone }) {
  const speakers = speakerList(talk.data).map(person => escapeHtml(person.name)).join(" e ");
  const live = talk.kind === "live";
  return `<header class="cd-talk" style="--track-color:${track.color}">
    <div class="cd-track">${escapeHtml(track.label)}${track.room ? ` · ${escapeHtml(track.room)}` : ""}</div>
    <h1 class="cd-talk-title">${escapeHtml(talk.data.title)}</h1>
    <p class="cd-talk-meta">${speakers ? `${speakers} · ` : ""}${clock(talk.slot.start, timezone)} às ${clock(talk.slot.end, timezone)}</p>
    ${live ? `<div class="cd-progress" aria-hidden="true"><b style="width:${Math.round(talk.progress * 100)}%"></b></div>` : ""}
  </header>`;
}

function boardQuestionMarkup(question) {
  const hasVotes = typeof question.votes === "number"; // só com o quadro publicando votos (config publishVotes)
  return `<li class="cd-question${hasVotes ? "" : " cd-question--no-votes"}">
    ${hasVotes ? `<span class="cd-question-votes">${question.votes}<small>${question.votes === 1 ? "voto" : "votos"}</small></span>` : ""}
    <div><p class="cd-question-text">${escapeHtml(question.text)}</p><p class="cd-question-author">${escapeHtml(question.name)}</p></div>
  </li>`;
}

/**
 * Quadro de perguntas aprovadas, mais votadas primeiro. `phase`: "open" (palestra rolando: dá pra perguntar) ou
 * "closed" (acabou: só as que já foram aprovadas). `offline` avisa quando a última leitura falhou (mantém a lista).
 */
function boardQuestionsMarkup({ questions, phase, offline = false }) {
  const title = phase === "open" ? "Perguntas ao vivo" : "Perguntas encerradas";
  const hint = phase === "open" ? "Pergunte pelo celular: só quem fez check-in, e o moderador aprova antes de aparecer aqui." : "As perguntas fecharam com o fim da palestra.";
  const list = questions.length
    ? `<ul class="cd-question-list">${questions.map(boardQuestionMarkup).join("")}</ul>`
    : `<p class="cd-question-empty">${phase === "open" ? "Nenhuma pergunta aprovada ainda." : "Nenhuma pergunta foi aprovada."}</p>`;
  return `<div class="cd-questions-head"><h2 class="cd-questions-title">${title}</h2>${offline ? `<span class="cd-offline">sem conexão, tentando de novo</span>` : ""}</div>
    <p class="cd-questions-hint">${hint}</p>${list}`;
}
