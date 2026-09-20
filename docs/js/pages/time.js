/**
 * Página: Time. Quem somos → Organizadores → Voluntários. Grupos filtrados
 * do mesmo TEAM (features/team.js), cada um some sozinho se vazio.
 */
function initTime() {
  initShell("time");

  const team = teamRepository.getAll();
  renderTeamIntro(teamIntroRepository.getAll(), document.getElementById("teamIntroSection"));
  renderTeamGroup(team, "organizador", document.getElementById("organizadoresSection"), document.querySelector("#organizadoresSection .team-grid"));
  renderTeamGroup(team, "voluntario", document.getElementById("voluntariosSection"), document.querySelector("#voluntariosSection .team-grid"));
}

initTime();
