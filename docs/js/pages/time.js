/**
 * Página: Time. Quem somos → Organizadores → Voluntários. Grupos filtrados
 * do mesmo TEAM (features/team.js), cada um some sozinho se vazio. O time é 100% real, então aparece
 * igual em PROD e em DEV (sem o gate de "será revelado em breve" das seções mock).
 */
function initTime() {
  initShell("time");

  const team = teamRepository.getAll();
  const personModal = createPersonModal();
  const onSelect = person => personModal.open(person);
  renderTeamIntro(teamIntroRepository.getAll(), document.getElementById("teamIntroSection"));
  renderTeamGroup(team, "organizador", document.getElementById("organizadoresSection"), document.querySelector("#organizadoresSection .team-grid"), { onSelect });
  renderTeamGroup(team, "voluntario", document.getElementById("voluntariosSection"), document.querySelector("#voluntariosSection .team-grid"), { onSelect });
}

initTime();
