/**
 * Feature: seção Moderadores do admin (CRUD da lista de moderadores). Lista ao vivo `moderators/<e-mail>`, cadastra por e-mail e remove em dois toques (features/two-tap-confirm.js). Todo
 * moderador entra com Google (as regras exigem e-mail verificado); só o DONO (e-mail fixo nas regras) lista, cadastra e remove: outra conta moderadora vê "sem permissão" (a regra é a defesa, a tela
 * só avisa). O formulário é desenhado UMA vez (quem digita não perde o texto); só as áreas `data-slot` são refeitas.
 * Tudo por parâmetro: `repository` ({ listen, set, remove }), `rules` (features/moderator-rules.js), `config` (ADMIN_MODERATORS: limite, prazo e textos), `selfEmail` (quem está logado: marca "você" e
 * vai em `addedBy`), `schedule`, `formatDate`. Devolve `{ stop }`.
 */
function initAdminModerators(containerEl, { repository, rules, config, selfEmail, schedule = defaultSchedule, formatDate = ms => new Date(ms).toLocaleDateString("pt-BR") }) {
  const { text } = config;
  let list = [];
  let message = "";
  let busy = false;
  let stopped = false;
  let stopListening = () => {};

  const paint = () => {
    if (stopped) return;
    Object.entries(adminModeratorsSlots({ list: rules.sortModerators(list), armedId: confirm.armed(), selfEmail, busy, message, text, formatDate })).forEach(([name, markup]) => {
      containerEl.querySelector(`[data-slot="${name}"]`).innerHTML = markup;
    });
  };
  const confirm = createTwoTapConfirm({ schedule, confirmMs: config.confirmMs, onChange: paint });
  const failure = error => (error?.code === "permission-denied" ? text.ownerOnly : text.saveFailed);

  async function run(work, done) {
    busy = true;
    message = "";
    paint();
    try {
      await work();
      message = done;
    } catch (error) {
      message = failure(error);
    }
    busy = false;
    paint();
  }

  containerEl.innerHTML = adminModeratorsShellMarkup({ text });
  paint();
  stopListening = repository.listen(next => { list = next; paint(); }, error => { message = error?.code === "permission-denied" ? text.ownerOnly : text.readFailed; paint(); });

  containerEl.addEventListener("click", event => {
    if (busy) return;
    if (event.target.closest("[data-moderator-add]")) {
      const input = containerEl.querySelector("[data-moderator-email]");
      let entry;
      try {
        entry = rules.buildModeratorToAdd({ text: input.value, list, addedBy: selfEmail, max: config.max });
      } catch (error) {
        message = `${error.message[0].toUpperCase()}${error.message.slice(1)}.`;
        return paint();
      }
      run(() => repository.set(entry.id, entry.data), text.added).then(() => { if (message === text.added) input.value = ""; });
      return;
    }
    const removeButton = event.target.closest("[data-moderator-remove]");
    if (removeButton) {
      message = "";
      const id = removeButton.dataset.moderatorRemove;
      confirm.press(id, () => run(() => repository.remove(id), text.removed));
    }
  });

  return { stop: () => { stopped = true; stopListening(); confirm.disarm(); } };
}
