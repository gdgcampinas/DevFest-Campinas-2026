/**
 * Feature: seção Lista de espera do admin. Lista ao vivo quem pediu pra ser avisado quando os ingressos abrirem (`waitlist`, só moderador lê), com busca por nome ou e-mail, o total de PESSOAS (a mesma pessoa
 * em dois aparelhos conta uma vez), BAIXAR CSV e COPIAR E-MAILS (sem repetidos, prontos pra colar no campo Cco de um e-mail) e remover (pedido de saída da lista, em dois toques). Nome e e-mail vêm da plateia:
 * sempre escapados. A busca é desenhada UMA vez (quem digita não perde o texto); só as áreas `data-slot` são refeitas.
 * Tudo por parâmetro: `repository` ({ listen(filters, onNext, onError), remove(id) }), `rules` (features/waitlist-rules.js: dedupeWaitlist, sortWaitlist, waitlistCsv, waitlistEmails), `text`
 * (data/admin-sections.js: ADMIN_WAITLIST), `confirmMs`, `schedule`, `formatDate(ms)`, `download({ filename, text, type })`, `copy(text)`. Devolve `{ stop }`.
 */
function initAdminWaitlist(containerEl, { repository, rules, text, confirmMs = 5000, schedule = defaultSchedule, formatDate = ms => new Date(ms).toLocaleDateString("pt-BR"), download, copy }) {
  let entries = [];
  let query = "";
  let message = "";
  let busy = false;
  let stopped = false;
  const confirm = createTwoTapConfirm({ schedule, confirmMs, onChange: () => paint() });
  const matches = item => `${item.name} ${item.email}`.toLowerCase().includes(query.trim().toLowerCase());
  const failure = (error, fallback) => (error?.code === "permission-denied" ? text.noPermission : fallback);

  function paint() {
    if (stopped) return;
    const list = rules.sortWaitlist(entries).filter(matches);
    const unique = rules.dedupeWaitlist(entries).length;
    Object.entries(adminWaitlistSlots({ list, total: entries.length, unique, query, armedId: confirm.armed(), busy, message, text, formatDate })).forEach(([name, markup]) => {
      containerEl.querySelector(`[data-slot="${name}"]`).innerHTML = markup;
    });
  }

  containerEl.innerHTML = adminWaitlistShellMarkup({ text });
  paint();
  const stopListening = repository.listen({}, next => { entries = next; paint(); }, error => { message = failure(error, text.readFailed); paint(); });

  containerEl.addEventListener("input", event => {
    if (event.target.matches("[data-waitlist-search]")) { query = event.target.value; paint(); }
  });

  containerEl.addEventListener("click", async event => {
    if (busy) return;
    if (event.target.closest("[data-waitlist-download]")) {
      download({ filename: text.csvFile, text: rules.waitlistCsv(entries, { formatDate: ms => new Date(ms).toISOString(), headers: text.csvHeaders }), type: "text/csv;charset=utf-8" });
      message = text.downloaded;
      return paint();
    }
    if (event.target.closest("[data-waitlist-copy]")) {
      try {
        await copy(rules.waitlistEmails(entries));
        message = text.copied;
      } catch {
        message = text.copyFailed;
      }
      return paint();
    }
    const removeButton = event.target.closest("[data-waitlist-remove]");
    if (!removeButton) return;
    message = "";
    const id = removeButton.dataset.waitlistRemove;
    confirm.press(id, async () => {
      busy = true;
      paint();
      try {
        await repository.remove(id);
        message = text.removed;
      } catch (error) {
        message = failure(error, text.removeFailed);
      }
      busy = false;
      paint();
    });
  });

  return { stop: () => { stopped = true; stopListening(); confirm.disarm(); } };
}

/** O que o navegador faz de verdade: baixar um arquivo de texto (link temporário) e copiar pra área de transferência. */
function defaultAdminWaitlistDeps() {
  return {
    repository: window.moderationWaitlistRepository,
    rules: { dedupeWaitlist, sortWaitlist, waitlistCsv, waitlistEmails },
    text: adminWaitlistRepository.getAll(),
    confirmMs: adminWaitlistRepository.getAll().confirmMs,
    formatDate: ms => new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    download({ filename, text, type }) {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const link = Object.assign(document.createElement("a"), { href: url, download: filename });
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    copy: value => navigator.clipboard.writeText(value),
  };
}
