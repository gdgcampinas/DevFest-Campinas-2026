/**
 * Feature: avaliação do evento inteiro (fase 5.3), sobre o Firestore
 * (window.eventFeedbackRepository, mesmo createFirestoreRepository de
 * checkin-repository.js/feedback-repository.js). Uma chave fixa por
 * edição (não por palestra) — `EVENT_FEEDBACK_KEY` — porque só existe
 * um registro possível por pessoa aqui, ao contrário do feedback por
 * palestra (features/talk-feedback.js), que tem uma chave por talk.
 *
 * Mesmo cuidado de ordem de execução de talk-feedback.js:
 * `window.firebaseClient`/`window.eventFeedbackRepository` só existem
 * depois que os módulos do SDK rodam, então nunca são lidos no corpo
 * síncrono de initEventFeedback() nem em render() antes de
 * runAfterModules(); no handler de submit já é seguro. Falha ao
 * consultar o estado esconde o bloco em vez de deixar "Carregando…".
 */
const EVENT_FEEDBACK_KEY = "event-end";

function initEventFeedback(rootEl) {
  async function resolveState() {
    const uid = await window.firebaseClient.ensureAnonymousUid();
    const rated = await window.eventFeedbackRepository.has(uid, EVENT_FEEDBACK_KEY).catch(() => false);
    return { phase: rated ? "done" : "rate" };
  }

  /** Preenche containerEl com o bloco de avaliação (chamado pelo live-status ao mostrar o hero "Encerrado"). */
  async function render(containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = eventFeedbackMarkup({ phase: "loading" });
    // o hero "Encerrado" é desenhado no bootstrap síncrono da página, antes dos módulos do Firebase
    await new Promise(resolve => runAfterModules(resolve));
    try {
      containerEl.innerHTML = eventFeedbackMarkup(await resolveState());
    } catch {
      containerEl.innerHTML = "";
    }
  }

  rootEl.addEventListener("submit", async event => {
    const form = event.target.closest("[data-event-feedback-form]");
    if (!form) return;
    event.preventDefault();
    const container = form.closest("[data-event-feedback-container]");
    const submitBtn = form.querySelector("[type=submit]");
    submitBtn.disabled = true;
    const uid = await window.firebaseClient.ensureAnonymousUid();
    const rating = Number(new FormData(form).get("event-rating"));
    const name = form.querySelector("[name=name]").value.trim();
    const highlight = form.querySelector("[name=highlight]").value.trim();
    try {
      await window.eventFeedbackRepository.add(uid, EVENT_FEEDBACK_KEY, {
        entryKey: EVENT_FEEDBACK_KEY,
        rating,
        ...(name ? { name } : {}),
        ...(highlight ? { highlight } : {}),
      });
      if (container) container.innerHTML = eventFeedbackMarkup({ phase: "done" });
    } catch {
      submitBtn.disabled = false;
    }
  });

  return { render };
}
