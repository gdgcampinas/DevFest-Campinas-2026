/**
 * Página: Time. Quem somos → Organizadores → Fotos → Voluntários.
 * Fotos reusa a mesma feature de galeria da home (renderHighlights),
 * dado diferente (TEAM_PHOTOS), zero código novo pra isso.
 */
function initTime() {
  initShell("time");

  const team = teamRepository.getAll();
  renderTeamIntro(teamIntroRepository.getAll(), document.getElementById("teamIntroSection"));
  renderTeamGroup(team, "organizador", document.getElementById("organizadoresSection"), document.querySelector("#organizadoresSection .team-grid"));
  renderTeamGroup(team, "voluntario", document.getElementById("voluntariosSection"), document.querySelector("#voluntariosSection .team-grid"));

  const modal = createTalkModal(document.getElementById("talkModal"), document.getElementById("talkModalContent"));
  initMenuCarousel(document.getElementById("talkModal"));
  renderHighlights(teamPhotosRepository.getAll(), document.getElementById("teamPhotosSection"), document.querySelector(".highlights-grid"), modal);
}

initTime();
