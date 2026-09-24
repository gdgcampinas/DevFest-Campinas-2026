/**
 * Feature: o QUADRO DA SALA, tela ao vivo pra deixar numa TV ou tablet da sala (uma por trilha; roda o dia inteiro
 * na mesma aba e se atualiza sozinha). Junta, num lugar só, tudo o que liga a sala à palestra:
 *   - a palestra da sala (título, quem fala, horário, progresso);
 *   - as perguntas ao vivo aprovadas pelo moderador (features/board-questions.js), abertas durante a palestra;
 *   - os QR: "Check-in nesta palestra" (a que está rolando), "Avalie esta palestra" (a última terminada, até a
 *     próxima começar; quem escaneia já faz o check-in junto) e "Avalie o evento" (depois do fim).
 * O que mostrar em cada horário é decidido por resolveRoomBoard() (room-board.js, função pura e testada); aqui só se
 * desenha. `boardQuestions` (opcional) é quem lê e mostra as perguntas.
 */
function initCheckinDisplay(rootEl, { schedule, track, timezone, siteUrl, now = () => new Date(), boardQuestions = null, extraQuery = "", pinnedCode = null }) {
  const bodyEl = rootEl.querySelector(".cd-body");
  let lastSignature = null;

  function draw(board) {
    const { panels, message, talk, questionsPhase } = board;
    const signature = [panels ? panels.map(panel => panel.url).join("|") : message, talk?.key, questionsPhase].join("#");
    if (signature !== lastSignature) { // nada mudou desde o último tick: não redesenha (evita piscar o QR)
      lastSignature = signature;
      bodyEl.innerHTML = [
        talk ? roomTalkHeaderMarkup({ track, talk, timezone }) : `<div class="cd-track" style="--track-color:${track.color}">${escapeHtml(track.label)}</div>`,
        `<div class="${talk ? "cd-main" : "cd-solo"}">`,
        talk && boardQuestions ? `<section class="cd-questions" id="cdQuestions"></section>` : "",
        panels ? `<div class="cd-panels${panels.length > 1 ? " cd-panels--multi" : ""}${talk ? " cd-panels--compact" : ""}">${panels.map(roomPanelMarkup).join("")}</div>` : `<div class="cd-empty">${message}</div>`,
        "</div>",
      ].join("");
      const size = talk ? (panels?.length > 1 ? 150 : 200) : panels?.length > 1 ? 280 : 360;
      (panels ?? []).forEach(panel => new QRCode(document.getElementById(panel.id), { text: panel.url, width: size, height: size, colorDark: "#05060a", colorLight: "#ffffff" }));
    }
    boardQuestions?.follow(talk ? { mountEl: document.getElementById("cdQuestions"), key: talk.key, phase: questionsPhase } : null);
    const bar = bodyEl.querySelector(".cd-progress b");
    if (bar && talk) bar.style.width = `${Math.round(talk.progress * 100)}%`;
  }

  const tick = () => draw(resolveRoomBoard({
    schedule, track, siteUrl, now: now(), extraQuery, pinnedCode,
    keyOf: talkKey,
    codeOf: (slot, trackId) => talkShareCode(slot, trackId, timezone),
  }));
  tick();
  setInterval(tick, 5000);
}
