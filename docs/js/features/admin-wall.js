/**
 * Feature: seção Recados do admin, a MODERAÇÃO do mural de recados. Lista ao vivo todos os recados da edição e deixa o moderador aprovar (vai ao telão em instantes), recusar, tirar do ar e devolver, com
 * um toque. O texto vem da plateia: sempre escapado e só vai ao telão depois de aprovado (as regras do Firestore deixam o telão ler SÓ os aprovados). Quem modera as fotos do telão modera os recados.
 * Tudo por parâmetro: `repository` ({ listen(filters, onNext, onError), update(id, fields) }), `rules` (features/wall-moderation.js), `config` (data/wall-config.js, pra o nome das perguntas), `text`
 * (data/admin-sections.js: ADMIN_WALL), `formatTime(ms)`. Devolve `{ stop }`.
 */
function initAdminWall(containerEl, { repository, rules, config, text, formatTime }) {
  let posts = [];
  let message = "";
  let busyId = null;
  let stopped = false;
  const promptLabelOf = id => config.prompts.find(prompt => prompt.id === id)?.label ?? id;
  const slot = name => containerEl.querySelector(`[data-slot="${name}"]`);

  function paint() {
    if (stopped) return;
    const groups = rules.groupWallPosts(posts);
    const list = items => adminWallListMarkup({ posts: items, text, promptLabelOf, formatTime, busyId });
    slot("pending").innerHTML = list(groups.pending);
    slot("approved").innerHTML = list(groups.approved);
    slot("other").innerHTML = list(groups.other);
    slot("message").innerHTML = message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "";
  }

  containerEl.innerHTML = adminWallShellMarkup({ text });
  paint();
  const stopListening = repository.listen({}, next => { posts = next; paint(); }, error => {
    message = error?.code === "permission-denied" ? text.noPermission : text.readFailed;
    paint();
  });

  containerEl.addEventListener("click", async event => {
    const button = event.target.closest("[data-wall-action]");
    if (!button || busyId) return;
    const id = button.dataset.wallId;
    busyId = id;
    message = "";
    paint();
    try {
      await repository.update(id, { status: rules.wallStatusFor(button.dataset.wallAction) });
    } catch (error) {
      message = error?.code === "permission-denied" ? text.noPermission : text.saveFailed;
    }
    busyId = null;
    paint();
  });

  return { stop: () => { stopped = true; stopListening(); } };
}
