/**
 * Templates do concurso da sessão (Coding Jam) dentro do modal da palestra, lado da plateia: cadastrar o próprio projeto, votar e
 * ver o pódio. Só markup: features/talk-contest.js decide estado e cliques. Nome e projeto digitados passam sempre por escapeHtml.
 * Reusa as classes e o item de lista das perguntas (components/talk-questions.js) e o pódio do destaque (talk-highlight.js).
 */
const contestProjectList = (projects, { voteEnabled, locked, votedId, myId }) =>
  `<ul class="question-list">${projects
    .map(project => questionItemMarkup(
      { id: project.id, text: project.project, name: project.name, mine: project.id === myId, voted: project.id === votedId, locked },
      { voteEnabled, voteAttribute: "data-contest-vote" }))
    .join("")}</ul>`;

const contestRefreshMarkup = () => `<button type="button" class="chip-btn" data-contest-refresh>${iconMarkup("link")}${t("contest.refresh", "Atualizar lista")}</button>`;

/**
 * Fases: "locked" (sem check-in), "loading", "error", "waiting" (a sessão ainda não começou), "open" (cadastra e vota) e
 * "closed" (acabou: só leitura, com o pódio quando o moderador já publicou). `projects` já vem em ordem de cadastro; `mine`
 * é o projeto da própria pessoa (ou null); `votedId` é o projeto em que ela votou e `alreadyVoted` diz que ela já votou (mesmo sem
 * saber em qual); `podium` é [{ place, project, name }] (ou null) e `highlight` traz os lugares/prêmios (data/talk-highlights.js).
 */
function talkContestMarkup({ phase, entryKey, projects = [], mine = null, votedId = "", alreadyVoted = false, name = "", message = "", maxLength, podium = null, highlight = null }) {
  const title = `<p class="talk-feedback-title">${iconMarkup(highlight?.icon ?? "trophy")}${t("contest.title", "Cadastre seu projeto e vote")}</p>`;
  const wrap = body => `<div class="talk-feedback">${title}${body}</div>`;
  if (phase === "locked") return wrap(`<p class="talk-feedback-hint">${t("contest.locked", "Faça o check-in nessa sessão pra cadastrar seu projeto e votar.")}</p>`);
  if (phase === "loading") return `<div class="talk-feedback talk-feedback--loading">${title}${t("contest.loading", "Carregando os projetos…")}</div>`;
  if (phase === "error") return wrap(`<p class="form-error" role="alert">${message}</p>${contestRefreshMarkup()}`);
  if (phase === "waiting") return wrap(`<p class="talk-feedback-hint">${t("contest.waiting", "O cadastro e a votação abrem quando a sessão começar e fecham quando ela terminar.")}</p>`);

  const open = phase === "open";
  if (!open) {
    const result = podium?.length
      ? `<p class="feedback-question">${t("highlight.podium", "Pódio")}</p>${talkPodiumMarkup(highlight?.podium ?? [], podium)}`
      : `<p class="talk-feedback-hint">${t("contest.closedNoResult", "A votação terminou. O pódio aparece aqui quando a organização publicar.")}</p>${contestRefreshMarkup()}`;
    return wrap(result);
  }

  const form = mine
    ? `<p class="feedback-question">${t("contest.mine", "Seu projeto")}</p><ul class="question-list"><li class="question-item question-item--mine"><div class="question-body"><p class="question-text">${escapeHtml(mine.project)}</p><p class="question-author">${escapeHtml(mine.name)}</p></div></li></ul>`
    : `<p class="talk-feedback-hint">${t("contest.formHint", "Cadastre o seu projeto pra turma poder votar nele. Só dá pra cadastrar um.")}</p>
      <form class="feedback-form question-form" data-contest-form data-entry-key="${entryKey}">
        <input type="text" class="feedback-input" name="project" placeholder="${t("contest.projectPlaceholder", "Nome do projeto")}" maxlength="${maxLength}" required>
        <input type="text" class="feedback-input" name="name" value="${escapeHtml(name)}" placeholder="${t("fb.name", "Seu nome")}" maxlength="${maxLength}" autocomplete="name" required>
        ${message ? `<p class="form-error" role="alert">${message}</p>` : ""}
        <button type="submit" class="chip-btn chip-btn--primary" data-track-event="contest_project_send" data-track-target="${entryKey}">${iconMarkup("check")}${t("contest.send", "Cadastrar projeto")}</button>
      </form>`;
  const voteHint = alreadyVoted || votedId ? `<p class="talk-feedback-hint">${t("contest.voted", "Seu voto foi registrado. Obrigado!")}</p>` : `<p class="talk-feedback-hint">${t("contest.voteHint", "Vote no projeto que mais gostou: é um voto só, e não vale no seu próprio projeto.")}</p>`;
  const crowd = projects.length
    ? `<p class="feedback-question">${t("contest.crowd", "Projetos da turma")}</p>${voteHint}${contestProjectList(projects, { voteEnabled: true, locked: alreadyVoted || Boolean(votedId), votedId, myId: mine?.id })}`
    : `<p class="talk-feedback-hint">${t("contest.empty", "Nenhum projeto cadastrado ainda.")}</p>`;
  // Com o formulário na tela o aviso aparece dentro dele; sem formulário (já tem projeto) aparece aqui, acima da lista.
  const notice = message && mine ? `<p class="form-error" role="alert">${message}</p>` : "";
  return wrap(`${form}${notice}${crowd}${contestRefreshMarkup()}`);
}
