/**
 * Cena do pódio do Coding Jam, ao vivo: mostra o último pódio publicado (`ctx.live.podium` = { key, items }, onde `items` são os lugares, preenchido por features/mural-live-bindings.js)
 * com os mesmos lugares do card e do quadro da sala (talkPodiumMarkup). Entra na frente do rodízio quando o moderador publica (interrupção) e
 * continua no rodízio depois. Os lugares ENTRAM do último pro primeiro (3º, 2º, 1º), um a cada MURAL_CONFIG.motion.podiumStepMs (`--i` por lugar, o CSS faz o resto).
 * Tudo injetado: `talkIndex` (buildTalkIndex), `highlightOf` (data/talk-highlights.js).
 */
function createPodiumScene({ talkIndex, highlightOf }) {
  return {
    prepare(_params, ctx) {
      const live = ctx.live.podium;
      const entry = live?.items?.length ? talkIndex.get(live.key) : null;
      const highlight = entry ? highlightOf(entry.data) : null;
      return highlight ? { highlight, winners: live.items, talk: entry.data } : MURAL_SKIP;
    },
    render({ highlight, winners, talk }) {
      return { markup: `<section class="ms ms-podium">${muralHeadMarkup({ kicker: highlight.label, title: "O pódio chegou" })}<p class="ms-hint">${escapeHtml(talk.title)}</p><div class="ms-podium-board">${talkPodiumMarkup(highlight.podium, winners, { slotStyle: index => `--i:${highlight.podium.length - 1 - index}` })}</div></section>` };
    },
  };
}
