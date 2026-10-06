/**
 * Contagem do concurso da sessão. Funções puras, arquivo "dual" (navegador e Node), testadas em DevFestIA/tools/contest.
 *   rankProjects  projetos + votos -> lista ordenada: mais votos primeiro; empate fica com quem cadastrou antes
 *   buildPodium   os `size` primeiros COM voto -> [{ place, project, name }] (o formato do documento `contest-results/<talkKey>`)
 * Voto em projeto que não existe mais (o moderador apagou) é ignorado. Ninguém fica no pódio sem voto.
 */
function rankProjects(projects, votes) {
  const counts = new Map();
  votes.forEach(vote => counts.set(vote.projectId, (counts.get(vote.projectId) ?? 0) + 1));
  return projects
    .map(project => ({ ...project, votes: counts.get(project.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.createdAtMs - b.createdAtMs);
}

function buildPodium(ranking, size) {
  return ranking
    .filter(project => project.votes > 0)
    .slice(0, size)
    .map((project, index) => ({ place: index + 1, project: project.project, name: project.name }));
}

if (typeof module !== "undefined") module.exports = { rankProjects, buildPodium };
