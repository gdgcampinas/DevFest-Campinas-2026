/**
 * Feature: seção de organizadores/time — some por completo (sem
 * espaço vazio no layout) enquanto TEAM estiver vazio. Mesmo padrão
 * de features/sponsors.js.
 */
function renderTeamSection(team, sectionEl, gridEl) {
  sectionEl.hidden = team.length === 0;
  if (team.length === 0) return;
  renderPersonGrid(team, gridEl);
}
