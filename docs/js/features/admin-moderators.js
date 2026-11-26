/**
 * Feature: seção Moderadores do admin (CRUD da lista de moderadores). Lista ao vivo `moderators/<e-mail>`, cadastra por e-mail e remove em dois toques (features/two-tap-confirm.js). Todo
 * moderador entra com Google (as regras exigem e-mail verificado); só o DONO (e-mail fixo nas regras) lista, cadastra e remove: outra conta moderadora vê "sem permissão" (a regra é a defesa, a tela
 * só avisa). O formulário é desenhado UMA vez (quem digita não perde o texto); só as áreas `data-slot` são refeitas.
 * Tudo por parâmetro: `repository` ({ listen, set, remove }), `rules` (features/moderator-rules.js), `config` (ADMIN_MODERATORS: limite, prazo e textos), `invite` (opcional, o convite pelo Gmail: features/moderator-invite.js), `seenRepository` (opcional, { listen }: quem já entrou, features/moderator-seen.js), `invitedRepository` (opcional, { listen, set }: quem já recebeu o convite), `selfEmail` (quem está logado: marca "você" e
 * vai em `addedBy`), `schedule`, `formatDate`. Devolve `{ stop }`.
 */
function initAdminModerators(containerEl, { repository, rules, config, selfEmail, invite = null, seenRepository = null, invitedRepository = null, formatSeen = ms => new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }), schedule = defaultSchedule, formatDate = ms => new Date(ms).toLocaleDateString("pt-BR") }) {
  const { text } = config;
  let list = [];
  let message = "";
  let busy = false;
  let stopped = false;
  let stopListening = () => {};
  let seen = null; // null = não dá pra saber (sem repositório, sem permissão ou ainda carregando): a lista não mostra o estado
  let stopSeen = () => {};
  let invited = null; // quem já recebeu o convite; null = não dá pra saber (mesma regra do `seen`)
  let stopInvited = () => {};

  const paint = () => {
    if (stopped) return;
    Object.entries(adminModeratorsSlots({ list: rules.sortModerators(list), armedId: confirm.armed(), selfEmail, busy, message, text, formatDate, invite, seen, invited, formatSeen })).forEach(([name, markup]) => {
      containerEl.querySelector(`[data-slot="${name}"]`).innerHTML = markup;
    });
  };
  const confirm = createTwoTapConfirm({ schedule, confirmMs: config.confirmMs, onChange: paint });
  const failure = error => (error?.code === "permission-denied" ? text.ownerOnly : text.saveFailed);

  async function run(work, done, explain = failure) {
    busy = true;
    message = "";
    paint();
    try {
      const result = await work();
      message = typeof done === "function" ? done(result) : done;
    } catch (error) {
      message = explain(error);
    }
    busy = false;
    paint();
  }

  containerEl.innerHTML = adminModeratorsShellMarkup({ text });
  paint();
  stopListening = repository.listen(next => { list = next; paint(); }, error => { message = error?.code === "permission-denied" ? text.ownerOnly : text.readFailed; paint(); });

  if (seenRepository) stopSeen = seenRepository.listen(
    next => { seen = new Map(next.map(item => [item.id, item.createdAtMs])); paint(); },
    () => { seen = null; paint(); },
  );

  if (invitedRepository) stopInvited = invitedRepository.listen(
    next => { invited = new Map(next.map(item => [item.id, item.createdAtMs])); paint(); },
    () => { invited = null; paint(); },
  );

  /** Marca quem recebeu; devolve false quando não deu pra gravar (o e-mail já saiu de qualquer jeito). */
  async function markInvited(emails = []) {
    if (!invitedRepository) return true;
    try {
      await Promise.all(emails.map(email => invitedRepository.set(email, { email })));
      return true;
    } catch {
      return false;
    }
  }

  async function sendInvite(emails) {
    try {
      const delivered = await invite.send(emails);
      return { delivered, marked: await markInvited(delivered) };
    } catch (error) {
      await markInvited(error?.sent);
      throw error;
    }
  }

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
    const sendButton = event.target.closest("[data-moderator-send]");
    if (sendButton) {
      message = "";
      const key = sendButton.dataset.moderatorSend;
      const emails = key === "*" ? moderatorInviteAllTargets({ emails: list.map(item => item.id).filter(id => id !== selfEmail), invited, seen }).emails : [key];
      const { sent, notMarked, errors } = invite.text;
      const report = ({ delivered, marked }) => [sent.replace("{count}", delivered.length), marked ? "" : notMarked].filter(Boolean).join(" ");
      confirm.press(`invite:${key}`, () => run(() => sendInvite(emails), report, error => errors[error?.code] ?? errors.default));
      return;
    }
    const removeButton = event.target.closest("[data-moderator-remove]");
    if (removeButton) {
      message = "";
      const id = removeButton.dataset.moderatorRemove;
      confirm.press(id, () => run(() => repository.remove(id), text.removed));
    }
  });

  return { stop: () => { stopped = true; stopListening(); stopSeen(); stopInvited(); confirm.disarm(); } };
}
