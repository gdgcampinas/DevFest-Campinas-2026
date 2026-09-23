/**
 * Tela "Minhas palestras": as palestras em que a pessoa fez check-in, cada
 * uma com o bloco de feedback (features/talk-feedback.js preenche o
 * `data-my-talk-container`), o progresso e, no fim, a avaliação do evento.
 * Puro template. `items` = [{ key, title, timeLabel, trackLabel, color }].
 * `notice` = aviso opcional no topo. A cor da trilha entra por --track-color
 * inline (zero CSS por trilha).
 */
function myTalksMarkup({ items, done, notice = "" }) {
  const list = items.map(item => `<section class="my-talk" style="--track-color:${item.color}">
      <div class="my-talk-head">
        <span class="my-talk-time">${item.timeLabel} · ${item.trackLabel}</span>
        <strong class="my-talk-title">${item.title}</strong>
      </div>
      <div data-my-talk-container="${item.key}"></div>
    </section>`).join("");
  const body = items.length
    ? `<p class="my-talks-progress" data-my-talks-progress>${done} de ${items.length} avaliadas</p><div class="my-talks-list">${list}</div>`
    : `<p class="my-talks-empty">Você ainda não fez check-in em nenhuma palestra. Escaneie o QR code da sala ou abra a palestra na <a href="grade.html">grade</a> pra fazer check-in.</p>`;
  return `<div class="my-talks">
    <h3 class="my-talks-title">${iconMarkup("star")}Minhas palestras</h3>
    ${notice ? `<p class="my-talks-notice" role="alert">${notice}</p>` : ""}
    ${body}
    <h3 class="my-talks-title my-talks-title--event">${iconMarkup("calendar")}O evento</h3>
    <div data-my-talks-event></div>
  </div>`;
}
