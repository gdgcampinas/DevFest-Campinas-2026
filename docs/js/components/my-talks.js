/**
 * Tela "Minhas palestras": as palestras em que a pessoa fez check-in, cada
 * uma com o bloco de feedback (features/talk-feedback.js preenche o
 * `data-my-talk-container`), o progresso e, no fim, a avaliação do evento.
 * Puro template. `items` = [{ key, title, timeLabel, trackLabel, color }].
 * `notice` = aviso opcional no topo. A cor da trilha entra por --track-color
 * inline (zero CSS por trilha).
 */
/** "2 de 5 avaliadas": único lugar dessa frase (a tela e a atualização ao avaliar usam o mesmo). */
function myTalksProgressLabel(done, total) {
  return t("myTalks.progress", "{done} de {total} avaliadas", { done, total });
}

function myTalksMarkup({ items, done, notice = "" }) {
  const list = items.map(item => `<section class="my-talk" style="--track-color:${item.color}">
      <div class="my-talk-head">
        <span class="my-talk-time">${item.timeLabel} · ${item.trackLabel}</span>
        <strong class="my-talk-title">${item.title}</strong>
      </div>
      <div data-my-talk-container="${item.key}"></div>
    </section>`).join("");
  const body = items.length
    ? `<p class="my-talks-progress" data-my-talks-progress>${myTalksProgressLabel(done, items.length)}</p><div class="my-talks-list">${list}</div>`
    : `<p class="my-talks-empty">${t("myTalks.empty", "Você ainda não fez check-in em nenhuma palestra. Escaneie o QR code da sala ou abra a palestra na {grade} pra fazer check-in.", { grade: `<a href="grade.html">${t("myTalks.gradeLink", "grade")}</a>` })}</p>`;
  return `<div class="my-talks">
    <h3 class="my-talks-title">${iconMarkup("star")}${t("myTalks.title", "Minhas palestras")}</h3>
    ${notice ? `<p class="my-talks-notice" role="alert">${notice}</p>` : ""}
    ${body}
    <h3 class="my-talks-title my-talks-title--event">${iconMarkup("calendar")}${t("myTalks.event", "O evento")}</h3>
    <div data-my-talks-event></div>
  </div>`;
}
