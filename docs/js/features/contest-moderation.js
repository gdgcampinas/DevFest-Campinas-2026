/**
 * Feature: o concurso da sessão (Coding Jam) na tela do moderador (moderacao.html). É a "sessão" que a moderação de perguntas liga no
 * lugar da fila quando a palestra da sala não tem perguntas e tem concurso (ver features/question-moderation.js): lista os projetos
 * com os votos, deixa apagar um projeto (dois toques, sem `confirm()`) e PUBLICA o pódio (`contest-results/<talkKey>`), que a plateia, os
 * cards da grade e o quadro da sala leem. O placar só existe aqui: a plateia nunca vê a contagem. Só e-mail Google da lista de moderadores
 * lista votos e apaga projeto (a regra é a defesa, a tela só avisa).
 * Custo de leitura (plano grátis): lê projetos e votos da sessão ao abrir e a cada `config.moderatorRefreshMs`.
 *
 * Tudo por parâmetro: `config` (data/talk-contest.js), `deps()` ({ projects, votes, results }, resolvidos no uso; os testes passam
 * substitutos) e `highlightOf` (de onde vêm os lugares do pódio). `start({ talk, draw })` liga a sessão da palestra e devolve `{ stop }`;
 * `draw(data)` desenha o bloco (a moderação de perguntas cuida do cabeçalho, da conta e do login).
 */
function createContestModeration({ rootEl, config, deps = defaultContestModerationDeps, highlightOf = talkHighlightsRepository.forTalk }) {
  let active = null; // { talk, podiumSize, draw, ranking, published, armedId, message, timer }

  function paint() {
    if (!active) return;
    const { ranking, podiumSize, published, armedId, message } = active;
    active.draw({ contest: { ranking, podiumSize, published, armedId, message } });
  }

  async function load(session) {
    const { projects, votes, results } = deps();
    const [projectDocs, voteDocs, result] = await Promise.all([projects.getWhere({ talkKey: session.talk.key }), votes.getWhere({ talkKey: session.talk.key }), results.get(session.talk.key)]);
    session.ranking = rankProjects(projectDocs, voteDocs);
    session.published = result?.podium ?? null;
  }

  /** Relê e redesenha; erro (conta sem permissão, rede) vira aviso na própria tela. */
  async function refresh(session, { keepMessage = false } = {}) {
    try {
      await load(session);
      if (!keepMessage) session.message = "";
    } catch (error) {
      session.message = error.code === "permission-denied" ? "Sem permissão: essa conta não está na lista de moderadores." : "Não foi possível carregar agora. Tentando de novo em instantes.";
    }
    if (active === session) paint();
  }

  async function publish(session) {
    const podium = buildPodium(session.ranking, session.podiumSize);
    if (!podium.length) { session.message = "Ainda não há votos pra publicar um pódio."; return paint(); }
    try {
      await deps().results.set(session.talk.key, { podium });
      session.published = podium;
      session.message = "";
    } catch {
      session.message = "Não consegui publicar o pódio agora. Tente de novo.";
    }
    if (active === session) paint();
  }

  async function remove(session, projectId) {
    if (session.armedId !== projectId) { session.armedId = projectId; return paint(); } // primeiro toque só arma
    session.armedId = "";
    try {
      await deps().projects.remove(projectId);
      await refresh(session);
    } catch {
      session.message = "Não consegui apagar o projeto agora. Tente de novo.";
      paint();
    }
  }

  rootEl.addEventListener("click", event => {
    if (!active) return;
    const deleteBtn = event.target.closest("[data-contest-delete]");
    if (deleteBtn) return remove(active, deleteBtn.dataset.contestDelete);
    if (event.target.closest("[data-contest-publish]")) return publish(active);
    if (event.target.closest("[data-contest-refresh]")) return refresh(active);
  });

  function stop() {
    if (!active) return;
    clearInterval(active.timer);
    active = null;
  }

  function start({ talk, draw }) {
    stop();
    const session = { talk, podiumSize: highlightOf(talk.data)?.podium?.length ?? 3, draw, ranking: [], published: null, armedId: "", message: "", timer: null };
    active = session;
    session.timer = setInterval(() => refresh(session, { keepMessage: true }), config.moderatorRefreshMs);
    paint();
    refresh(session);
    return { stop };
  }

  return { start };
}

function defaultContestModerationDeps() {
  return {
    projects: window.moderationContestProjectsRepository,
    votes: window.moderationContestVotesRepository,
    results: window.moderationContestResultsRepository,
  };
}
