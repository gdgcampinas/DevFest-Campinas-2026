/**
 * Página: QUADRO DA SALA, antes "check-in ao vivo" (ferramenta interna, fora do nav/sitemap; o endereço não mudou
 * pra não quebrar os tablets já configurados).
 * `?trilha=<id>` escolhe a sala — sem esse parâmetro, ou com um id que
 * não existe em TRACKS, mostra a lista de trilhas disponíveis em vez de
 * quebrar (link errado é o erro mais provável aqui, sem tela de conserto
 * na hora do evento).
 */
function initCheckinDisplay_page() {
  const brandEl = document.getElementById("cdBrand");
  brandEl.textContent = EVENT.name;

  const trackId = new URLSearchParams(location.search).get("trilha");
  const track = TRACKS.find(t => t.id === trackId);

  if (!track) {
    document.getElementById("cdBody").innerHTML = `
      <div class="cd-empty">
        <p>Escolha a trilha na URL, ex.: <code>?trilha=${TRACKS[0].id}</code></p>
        <ul class="cd-track-list">${TRACKS.map(t => `<li><a href="?trilha=${t.id}" style="--track-color:${t.color}">${t.label}</a></li>`).join("")}</ul>
      </div>`;
    return;
  }

  const questionsConfig = talkQuestionsConfigRepository.getAll();
  initCheckinDisplay(document.getElementById("cdScreen"), {
    boardQuestions: questionsConfig.enabled ? createBoardQuestions({ config: questionsConfig }) : null,
    schedule: SCHEDULE,
    track,
    timezone: EVENT.timezone,
    siteUrl: EVENT.url,
    now: resolveNow(),
  });
}

initCheckinDisplay_page();
