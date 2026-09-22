/**
 * Página: Time. Quem somos → Organizadores → Voluntários. Grupos filtrados
 * do mesmo TEAM (features/team.js), cada um some sozinho se vazio.
 */
function initTime() {
  const reveal = initShell("time");

  const team = teamRepository.getAll();
  renderTeamIntro(teamIntroRepository.getAll(), document.getElementById("teamIntroSection"));
  renderOrConstruction(reveal, document.getElementById("organizadoresSection"),
    () => renderTeamGroup(team, "organizador", document.getElementById("organizadoresSection"), document.querySelector("#organizadoresSection .team-grid")),
    "Organizadores serão revelados em breve.");
  renderOrConstruction(reveal, document.getElementById("voluntariosSection"),
    () => renderTeamGroup(team, "voluntario", document.getElementById("voluntariosSection"), document.querySelector("#voluntariosSection .team-grid")),
    "Voluntários serão revelados em breve.");
}

initTime();
