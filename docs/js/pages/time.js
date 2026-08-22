/**
 * Página: Time. Quem somos → Organizadores → Fotos → Voluntários.
 * Fotos reusa a mesma feature de galeria da home (renderHighlights),
 * dado diferente (TEAM_PHOTOS), zero código novo pra isso.
 */
function initTime() {
  initShell("time");

  renderTeamIntro(TEAM_INTRO, document.getElementById("teamIntroSection"));
  renderTeamGroup(TEAM, "organizador", document.getElementById("organizadoresSection"), document.querySelector("#organizadoresSection .team-grid"));
  renderTeamGroup(TEAM, "voluntario", document.getElementById("voluntariosSection"), document.querySelector("#voluntariosSection .team-grid"));

  const modal = createTalkModal(document.getElementById("talkModal"), document.getElementById("talkModalContent"));
  initMenuCarousel(document.getElementById("talkModal"));
  renderHighlights(TEAM_PHOTOS, document.getElementById("teamPhotosSection"), document.querySelector(".highlights-grid"), modal);
}

initTime();
