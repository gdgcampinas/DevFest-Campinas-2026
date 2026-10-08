/**
 * Cena "agora e próximas": uma coluna por sala com a palestra no ar e a que vem a seguir. Os dados vêm de resolveNowAndNext (features/mural-now-next.js,
 * função pura e testada); aqui só se desenha. Em 16:9 são colunas lado a lado, em ultra largo uma faixa só, em tela alta empilha (css/mural.css, data-shape).
 * Tudo injetado: `schedule`, `tracks`, `timezone`, `phaseOf` (resolveEventState).
 */
function muralTalkMarkup(talk, { tag, modifier, timezone }) {
  if (!talk) return `<div class="ms-talk ms-talk--${modifier} ms-talk--empty"><span class="ms-tag">${tag}</span><p class="ms-talk-empty">${modifier === "now" ? "Sem palestra neste momento" : "Sem mais palestras"}</p></div>`;
  const who = talk.speakers.length ? `<p class="ms-talk-who">${escapeHtml(talk.speakers.join(", "))}</p>` : "";
  return `<div class="ms-talk ms-talk--${modifier}"><span class="ms-tag">${tag}</span><p class="ms-talk-title">${escapeHtml(talk.title)}</p>${who}<p class="ms-talk-time">${muralTimeRange(talk.start, talk.end, timezone)}</p></div>`;
}

function muralNowNextHeading(board, schedule, timezone) {
  if (board.phase === "before") return { kicker: "Em breve", title: `O DevFest começa às ${hourLabel(schedule[0].start, timezone)}` };
  return { kicker: "Agora no DevFest", title: board.banner ? board.banner.title : "Palestras acontecendo" };
}

function createNowNextScene({ schedule, tracks, timezone, phaseOf }) {
  return {
    render(_prepared, _params, ctx) {
      const board = resolveNowAndNext({ schedule, tracks, now: ctx.now, phaseOf });
      const banner = board.banner
        ? `<p class="ms-banner">${board.banner.room ? `${escapeHtml(board.banner.room)} · ` : ""}até ${formatEventTime(board.banner.end, timezone)}</p>`
        : "";
      const columns = board.columns.map(({ track, current, next }, index) => `
        <article class="ms-col ms-stagger"${muralStagger(index, `--track-color:${track.color}`)}>
          <h3 class="ms-track"><span>${escapeHtml(track.shortLabel ?? track.label)}</span><small>${escapeHtml(track.room ?? "")}</small></h3>
          ${board.phase === "before" ? "" : muralTalkMarkup(current, { tag: "Agora", modifier: "now", timezone })}
          ${muralTalkMarkup(next, { tag: "A seguir", modifier: "next", timezone })}
        </article>`).join("");
      return { markup: `<section class="ms ms-now">${muralHeadMarkup(muralNowNextHeading(board, schedule, timezone))}${banner}<div class="ms-columns" data-count="${board.columns.length}">${columns}</div></section>` };
    },
  };
}
