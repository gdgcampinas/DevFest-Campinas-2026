/**
 * Cena "Hoje no DevFest": a linha do dia (features/mural-day-timeline.js) como uma faixa de blocos, cada um com largura proporcional à duração; o que já passou fica apagado, o que está no ar
 * pulsa e o que vem aí fica claro. Embaixo: "Já vivemos N de M blocos de palestras" e o que vem a seguir (com o destaque, como o Coding Jam, quando o bloco tem). Em telão vertical a faixa fica em
 * pé. Tudo injetado: `schedule` (a grade), `timezone`, `formatTime(date, timezone)` e `highlightLabelOf(dadoDaPalestra)`.
 */
function createDayTimelineScene({ schedule, timezone, formatTime, highlightLabelOf }) {
  const nameOf = block => (block.highlight ? `${block.label}: ${block.highlight}` : block.label);
  return {
    render(_prepared, params, ctx) {
      const timeline = buildDayTimeline({ schedule, now: ctx.now, highlightLabelOf });
      const blocks = timeline.blocks.map((block, index) => `<li class="ms-day-block ms-stagger is-${block.status}" data-kind="${block.kind}" style="--minutes:${block.minutes};--i:${index}"${block.highlight ? ' data-highlight="true"' : ""}><b>${escapeHtml(block.kind === "talks" ? String(block.talkNumber) : block.label)}</b><span>${escapeHtml(formatTime(block.start, timezone))}</span></li>`).join("");
      const doneText = timeline.talksDone === timeline.talksTotal ? "Todos os blocos de palestras já aconteceram" : `Já vivemos ${timeline.talksDone} de ${timeline.talksTotal} blocos de palestras`;
      const nextText = timeline.next ? `A seguir: ${nameOf(timeline.next)} às ${formatTime(timeline.next.start, timezone)}` : "";
      const nowText = timeline.current ? `Agora: ${nameOf(timeline.current)}` : "";
      return {
        markup: `<section class="ms ms-day">${muralHeadMarkup({ kicker: params.kicker ?? "O dia no DevFest", title: params.title ?? "Hoje a gente vive isso juntos" })}
          <ol class="ms-day-line" aria-hidden="true">${blocks}</ol>
          <div class="ms-day-foot"><p class="ms-day-done">${escapeHtml(doneText)}</p>${nowText ? `<p class="ms-hint">${escapeHtml(nowText)}</p>` : ""}${nextText ? `<p class="ms-hint">${escapeHtml(nextText)}</p>` : ""}</div>
        </section>`,
      };
    },
  };
}
