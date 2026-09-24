/**
 * Página: moderação de perguntas (ferramenta interna, fora do nav/sitemap).
 * `?trilha=<id>` escolhe a sala, como em checkin-display.html; sem ela ou
 * com id inválido lista as trilhas (link errado é o erro mais provável).
 */
function initModeracaoPage() {
  setupRehearsal();
  const bodyEl = document.getElementById("modBody");
  const track = TRACKS.find(t => t.id === new URLSearchParams(location.search).get("trilha"));
  if (!track) {
    bodyEl.innerHTML = `<p class="mod-hint">Escolha a trilha na URL, ex.: <code>?trilha=${TRACKS[0].id}</code></p>
      <ul class="cd-track-list">${TRACKS.map(t => `<li><a href="?trilha=${t.id}" style="--track-color:${t.color}">${t.label}</a></li>`).join("")}</ul>`;
    return;
  }
  document.documentElement.style.setProperty("--track-color", track.color);
  initQuestionModeration(bodyEl, { schedule: SCHEDULE, track, config: talkQuestionsConfigRepository.getAll(), now: resolveNow() });
}

initModeracaoPage();
