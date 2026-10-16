/**
 * Feature: LISTA DE ESPERA dos ingressos (home e página Ingressos). Antes de os ingressos abrirem a pessoa deixa nome e e-mail e a organização avisa quando abrir. Mostra o cartão ("Ingressos em
 * breve", 3 passos, botão) e, ao tocar no botão, o formulário no próprio cartão (sem janela por cima); o envio grava UM documento por aparelho (id "<uid>_interest") no Firestore: se o aparelho já estava
 * na lista a regra recusa o segundo e a tela mostra "você já está na lista" em vez de erro. Erro de rede nunca apaga o que a pessoa digitou e o botão não envia duas vezes.
 * Tudo por parâmetro (DI): `enabled` (EVENT.tickets.waitlistOn, ver applyWaitlistMode em features/tickets.js), `repository` ({ add(uid, entryKey, data), has(uid, entryKey) }), `getUid()`, `config`
 * (data/waitlist-config.js), `text` (data/waitlist-texts.js), `rules` ({ validateWaitlistEntry }), `source` ("home" | "ingressos"), `lang`, `contactEmail`, `openAtStart` (abre o formulário já na carga,
 * ex.: ingressos.html#waitlist). Devolve `{ stop }`.
 */
function initWaitlist(rootEl, { enabled, repository, getUid, config, text, rules, source = "", lang = "", contactEmail = "", openAtStart = false }) {
  if (!rootEl) return { stop() {} };
  rootEl.hidden = !enabled;
  if (!enabled) return { stop() {} };
  let stopped = false;
  let sending = false;
  let alreadyIn = false;
  const panel = () => rootEl.querySelector('[data-slot="panel"]');
  const paintPanel = markup => { if (!stopped && panel()) { panel().innerHTML = markup; panel().hidden = false; } };
  const showForm = (extra = {}) => {
    paintPanel(waitlistFormMarkup({ text, contactEmail, ...extra }));
    if (!extra.errorField && !extra.message) rootEl.querySelector("[data-waitlist-name]")?.focus?.();
  };
  const hideOpenButton = () => { const open = rootEl.querySelector(".wl-open"); if (open) open.hidden = true; };

  async function open() {
    hideOpenButton();
    paintPanel(`<p class="wl-loading">${escapeHtml(text.sending)}</p>`);
    try {
      alreadyIn = await repository.has(await getUid(), config.entryKey);
    } catch {
      alreadyIn = false; // sem conseguir ler, deixa preencher: a regra do banco ainda barra o repetido
    }
    if (stopped) return;
    if (alreadyIn) paintPanel(waitlistResultMarkup({ text, state: "already" }));
    else showForm();
  }

  rootEl.innerHTML = waitlistCardMarkup({ text });
  rootEl.addEventListener("click", event => {
    if (event.target.closest("[data-waitlist-open]")) open();
  });

  rootEl.addEventListener("submit", async event => {
    const form = event.target.closest("[data-waitlist-form]");
    if (!form) return;
    event.preventDefault();
    if (sending) return;
    const values = { name: form.querySelector("[data-waitlist-name]").value, email: form.querySelector("[data-waitlist-email]").value };
    let entry;
    try {
      entry = rules.validateWaitlistEntry({ ...values, source, lang }, config);
    } catch (error) {
      return showForm({ values, errorField: error.field, message: error.field === "name" ? text.nameError : text.emailError });
    }
    sending = true;
    const button = form.querySelector("[data-waitlist-submit]");
    button.textContent = text.sending;
    button.disabled = true;
    try {
      await repository.add(await getUid(), config.entryKey, entry);
      paintPanel(waitlistResultMarkup({ text, state: "done" }));
    } catch (error) {
      if (error?.code === "permission-denied") paintPanel(waitlistResultMarkup({ text, state: "already" })); // a regra recusa o 2º cadastro do aparelho: a pessoa já está na lista
      else showForm({ values, message: text.sendError });
    }
    sending = false;
  });

  if (openAtStart) open();
  return { stop: () => { stopped = true; } };
}

/** As dependências de verdade da página (a plateia): lazy, porque os módulos do Firebase carregam depois do script da página. */
function defaultWaitlistDeps() {
  return {
    enabled: Boolean(EVENT.tickets.waitlistOn),
    repository: { add: (...args) => window.waitlistRepository.add(...args), has: (...args) => window.waitlistRepository.has(...args) },
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
    config: waitlistConfigRepository.getAll(),
    text: waitlistTextsRepository.getAll(),
    rules: { validateWaitlistEntry },
    lang: i18n.lang,
    contactEmail: contactRepository.getAll().email,
  };
}
