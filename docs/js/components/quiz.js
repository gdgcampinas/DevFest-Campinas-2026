/**
 * Templates do quiz "Monte sua trilha". Só markup: quem decide o passo,
 * a pontuação e os cliques é features/quiz.js. Textos vêm de `copy`
 * (data/quiz.js) e a cor/ícone da trilha vêm da própria trilha.
 */
function quizIntroMarkup(copy) {
  return `
    <h2 tabindex="-1" data-quiz-focus>${copy.title}</h2>
    <p class="faq-sub">${copy.subtitle}</p>
    <button type="button" class="chip-btn chip-btn--primary" data-quiz-start data-track-event="quiz_start">${copy.start}</button>`;
}

function quizQuestionMarkup({ question, index, total, selectedId, isLast, copy }) {
  const answers = question.answers.map(answer => `
    <label class="quiz-answer">
      <input type="radio" name="quiz-${question.id}" value="${answer.id}"${answer.id === selectedId ? " checked" : ""} data-quiz-answer>
      <span>${answer.label}</span>
    </label>`).join("");
  return `
    <p class="quiz-progress">Pergunta ${index + 1} de ${total}</p>
    <div class="quiz-progress-bar" aria-hidden="true"><span style="width:${((index + 1) / total) * 100}%"></span></div>
    <fieldset class="quiz-question">
      <legend tabindex="-1" data-quiz-focus>${question.text}</legend>
      <div class="quiz-answers">${answers}</div>
    </fieldset>
    <div class="quiz-actions">
      ${index > 0 ? `<button type="button" class="chip-btn" data-quiz-back>Voltar</button>` : ""}
      <button type="button" class="chip-btn chip-btn--primary" data-quiz-next${selectedId ? "" : " disabled"}>${isLast ? copy.seeResult : copy.next}</button>
    </div>`;
}

function quizTalkMarkup({ timeLabel, title, speakerNames }) {
  return `<li><span class="quiz-talk-time">${timeLabel}</span><span class="quiz-talk-title">${title}</span>${speakerNames ? `<span class="quiz-talk-speakers">${speakerNames}</span>` : ""}</li>`;
}

/**
 * `sharedBanner`: aviso de quem abriu o resultado de outra pessoa (opcional).
 * `talks`: itens de quizTalkMarkup (vazio = sem lista); `talksNotice` aparece no lugar da lista
 * quando as palestras ainda não foram reveladas. `agendaAdded` troca o botão pelo aviso.
 */
function quizResultMarkup({ track, runnerUp, talks, talksNotice, agendaAdded, whatsappUrl, sharedBanner, copy }) {
  const talksBlock = talks.length
    ? `<h3>${copy.suggestedTalks}</h3>
       <ul class="quiz-talks">${talks.map(quizTalkMarkup).join("")}</ul>
       ${agendaAdded
         ? `<p class="quiz-added">${copy.addedToAgenda}. <a href="grade.html">${copy.agendaLink}</a></p>`
         : `<button type="button" class="chip-btn chip-btn--primary" data-quiz-add-agenda data-track-event="quiz_add_agenda">${copy.addToAgenda}</button>`}`
    : `<p class="quiz-notice">${talksNotice}</p>`;
  return `
    ${sharedBanner ? `<p class="quiz-shared">${sharedBanner}</p>` : ""}
    <div class="quiz-result" style="--track-color:${track.color}">
      <span class="faq-icon">${iconMarkup(track.icon ?? "grid")}</span>
      <p class="quiz-progress">${copy.resultLabel}</p>
      <h2 tabindex="-1" data-quiz-focus>${track.label}</h2>
      <p class="quiz-desc">${track.description ?? ""}</p>
      ${runnerUp ? `<p class="quiz-also">${copy.alsoFits} <strong>${runnerUp.label}</strong></p>` : ""}
      ${talksBlock}
    </div>
    <div class="quiz-actions">
      <button type="button" class="chip-btn" data-quiz-copy data-track-event="quiz_share" data-track-target="copy">${iconMarkup("link")}<span>${copy.share}</span></button>
      <a class="chip-btn" href="${whatsappUrl}" target="_blank" rel="noopener" data-track-event="quiz_share" data-track-target="whatsapp">${iconMarkup("share")}${copy.whatsapp}</a>
      <button type="button" class="chip-btn" data-quiz-restart>${copy.restart}</button>
    </div>`;
}
