/**
 * Templates do concurso da sessão na tela do moderador (tablet da sala, ferramenta interna em português): projetos com a
 * contagem de votos, apagar projeto (com confirmação no próprio botão) e publicar o pódio. Só markup: quem carrega e decide o que
 * cada botão faz é features/contest-moderation.js. Reusa o item e as classes da moderação de perguntas.
 */
function contestModerationItemMarkup(item, { armedId = "" } = {}) {
  const armed = item.id === armedId;
  return `<li class="question-item question-item--moderation">
    <span class="question-votes" aria-label="${tn("q.votes", item.votes, "{count} voto", "{count} votos")}">${item.votes}</span>
    <div class="question-body"><p class="question-text">${escapeHtml(item.project)}</p><p class="question-author">${escapeHtml(item.name)}</p></div>
    <div class="question-actions"><button type="button" class="chip-btn" data-contest-delete="${escapeHtml(item.id)}">${armed ? "Apagar mesmo?" : "Apagar"}</button></div>
  </li>`;
}

/**
 * `ranking` já vem ordenado por votos (features/contest-ranking.js); `published` é o pódio que já está no ar (ou null); `podiumSize`
 * é quantos lugares ele tem; `armedId` é o projeto cujo "Apagar" já foi tocado uma vez; `message` é um aviso opcional.
 */
function contestModerationMarkup({ ranking = [], podiumSize = 3, published = null, armedId = "", message = "" }) {
  const status = published
    ? `Pódio publicado (${published.length} de ${podiumSize} lugares). Se a contagem mudar, publique de novo.`
    : "O pódio ainda não foi publicado: a plateia só vê o resultado quando você publicar.";
  const list = ranking.length
    ? `<ul class="question-list">${ranking.map(item => contestModerationItemMarkup(item, { armedId })).join("")}</ul>`
    : `<p class="mod-hint">Nenhum projeto cadastrado ainda.</p>`;
  return `<section class="mod-section"><h3 class="mod-section-title">Projetos e votos <span class="mod-count">${ranking.length}</span></h3>
    ${message ? `<p class="form-error" role="alert">${message}</p>` : ""}${list}
    <p class="mod-hint">${status}</p>
    <div class="question-actions"><button type="button" class="chip-btn" data-contest-refresh>Atualizar</button><button type="button" class="chip-btn chip-btn--primary" data-contest-publish>Publicar pódio</button></div>
  </section>`;
}
