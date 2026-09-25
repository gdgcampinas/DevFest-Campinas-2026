/**
 * Feature: check-in + avaliação de palestra. Escreve no Firestore
 * (checkinRepository/feedbackRepository, ver data/firebase-*.js) e decide a
 * fase de cada palestra pelo que ESTE navegador já fez (myCheckins/myRatings,
 * data/my-feedback.js): o uid anônimo é por navegador, então é equivalente e
 * não gasta leitura do Firestore. `index` é o buildTalkIndex() de
 * calendar-actions.js (entry.code é o código curto, o mesmo do QR de check-in).
 *
 * Duas entradas de check-in, mesma função:
 *   1) `?checkin=<code>` na URL (QR escaneado ou link).
 *   2) botão manual dentro do modal (honra, com confirmação inline).
 *
 * O bloco fica num elemento com `data-feedback-container="<entryKey>"` (é
 * assim que os handlers delegados sabem qual palestra re-renderizar). Depois
 * de gravar, dispara FEEDBACK_CHANGED_EVENT (Minhas palestras e o aviso de
 * "avalie" se atualizam sozinhos).
 *
 * `window.firebaseClient`/repositories só existem depois dos módulos do SDK
 * (ver runAfterModules em app.js): só são tocados dentro de handlers de
 * clique/submit e do handler de `?checkin=`.
 */
const FEEDBACK_CHANGED_EVENT = "devfest:feedback-changed";
/** Pede pra abrir a palestra (detail.key) no modal: disparado depois do check-in por QR, pra a pessoa já cair na palestra (perguntas e avaliação). `detail.message` é um aviso opcional pro bloco de check-in (ex.: o QR foi lido sem internet). */
const OPEN_TALK_EVENT = "devfest:open-talk";

/** Guarda o nome e já preenche os outros campos de nome abertos e vazios (não pedir o nome 10 vezes). */
function rememberName(repository, name) {
  repository.set(name);
  document.querySelectorAll('input[name="name"]').forEach(input => {
    if (!input.value.trim()) input.value = name;
  });
}

/** Aviso de erro logo acima do botão de envio (troca o anterior). Reusado pelos formulários de palestra e do evento. */
function showFormError(formEl, submitBtn, message) {
  formEl.querySelector(".talk-feedback-error")?.remove();
  submitBtn.insertAdjacentHTML("beforebegin", `<p class="talk-feedback-error" role="alert">${message}</p>`);
}

function initTalkFeedback(rootEl, { index, reveal = true, now = () => new Date(), myCheckins, myRatings, myName }) {
  const announceChange = () => rootEl.dispatchEvent(new CustomEvent(FEEDBACK_CHANGED_EVENT));

  /** Grava o check-in. "permission-denied" = já existia (a regra recusa o segundo); outro erro sobe pra quem chamou avisar. */
  async function doCheckin(entry) {
    const uid = await window.firebaseClient.ensureAnonymousUid();
    try {
      await window.checkinRepository.add(uid, entry.key, { entryKey: entry.key });
    } catch (error) {
      if (error.code !== "permission-denied") throw error;
    }
    myCheckins.addAll([entry.key]);
    announceChange();
  }

  function stateFor(entry) {
    if (!myCheckins.has(entry.key)) return { phase: "checkin", entryKey: entry.key };
    if (entry.slot.end > now()) return { phase: "waiting", entryKey: entry.key };
    return { phase: myRatings.has(entry.key) ? "done" : "rate", entryKey: entry.key };
  }

  /** Preenche containerEl com o bloco de feedback da palestra (chamado pelo modal e por Minhas palestras). `message` = aviso opcional. */
  function render(containerEl, entry, { message = "" } = {}) {
    if (!reveal || !containerEl) return;
    containerEl.dataset.feedbackContainer = entry.key;
    containerEl.innerHTML = talkFeedbackMarkup({ ...stateFor(entry), name: myName.get(), message });
  }

  /** `?checkin=<code>` na URL: faz o check-in e limpa o parâmetro. Agendado por runAfterModules. */
  async function handleCheckinParam() {
    const code = getParam("checkin");
    if (!code) return;
    const entry = index.getByCode(code);
    const url = new URL(location.href);
    url.searchParams.delete("checkin");
    history.replaceState(null, "", url);
    if (!entry) return;
    // Sem internet o check-in não grava: abre a palestra mesmo assim, com o aviso e o botão de check-in à mão.
    const failed = await doCheckin(entry).then(() => false, () => true);
    const message = failed ? t("checkin.offline", "Sem conexão agora. Tente de novo em instantes.") : "";
    rootEl.dispatchEvent(new CustomEvent(OPEN_TALK_EVENT, { detail: { key: entry.key, message } }));
  }
  if (getParam("checkin")) runAfterModules(handleCheckinParam);

  const containerOf = element => element.closest("[data-feedback-container]");
  const entryOf = element => index.get(element.dataset.entryKey);

  rootEl.addEventListener("click", async event => {
    const askBtn = event.target.closest("[data-feedback-checkin]");
    if (askBtn) {
      const entry = entryOf(askBtn);
      const container = containerOf(askBtn);
      if (entry && container) container.innerHTML = talkFeedbackMarkup({ phase: "checkin-confirm", entryKey: entry.key, title: entry.data.title });
      return;
    }

    const cancelBtn = event.target.closest("[data-feedback-checkin-cancel]");
    if (cancelBtn) {
      const entry = entryOf(cancelBtn);
      const container = containerOf(cancelBtn);
      if (entry && container) container.innerHTML = talkFeedbackMarkup({ phase: "checkin", entryKey: entry.key });
      return;
    }

    const confirmBtn = event.target.closest("[data-feedback-checkin-confirm]");
    if (confirmBtn) {
      const entry = entryOf(confirmBtn);
      const container = containerOf(confirmBtn);
      if (!entry || !container) return;
      confirmBtn.disabled = true;
      try {
        await doCheckin(entry);
        render(container, entry);
      } catch {
        container.innerHTML = talkFeedbackMarkup({ phase: "checkin", entryKey: entry.key, message: t("checkin.offline", "Sem conexão agora. Tente de novo em instantes.") });
      }
    }
  });

  rootEl.addEventListener("submit", async event => {
    const form = event.target.closest("[data-feedback-form]");
    if (!form) return;
    event.preventDefault();
    const entry = entryOf(form);
    const container = containerOf(form);
    if (!entry || !container) return;
    const submitBtn = form.querySelector("[type=submit]");
    const text = field => form.querySelector(`[name=${field}]`).value.trim();
    const name = text("name");
    if (!name) return showFormError(form, submitBtn, t("fb.nameRequired", "Informe seu nome pra enviar a avaliação."));
    submitBtn.disabled = true;
    const optional = { highlight: text("highlight"), improve: text("improve") };
    try {
      const uid = await window.firebaseClient.ensureAnonymousUid();
      await window.feedbackRepository.add(uid, entry.key, {
        entryKey: entry.key,
        rating: Number(new FormData(form).get(`rating-${entry.key}`)),
        name,
        ...Object.fromEntries(Object.entries(optional).filter(([, value]) => value)),
      });
      rememberName(myName, name);
      myRatings.addAll([entry.key]);
      render(container, entry);
      announceChange();
    } catch {
      submitBtn.disabled = false;
      showFormError(form, submitBtn, t("rate.sendError", "Não foi possível enviar agora. Confira sua conexão e o check-in e tente de novo."));
    }
  });

  return { render, handleCheckinParam, checkin: doCheckin };
}
