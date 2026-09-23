/**
 * Feature: avaliação do evento inteiro (fase 5.3), sobre o Firestore
 * (window.eventFeedbackRepository). Uma chave fixa por edição
 * (`EVENT_FEEDBACK_KEY`), um registro por pessoa. Como o feedback de
 * palestra, decide a fase pelo que este navegador já fez (myRatings) e só
 * toca o Firebase no envio, então `render` é síncrono e nunca trava.
 * Tudo injetado: `form` (perguntas), `myRatings`, `now`, `endsAt` (fim do evento).
 */
const EVENT_FEEDBACK_KEY = "event-end";

function initEventFeedback(rootEl, { form, myRatings, now = () => new Date(), endsAt }) {
  const phaseNow = () => {
    if (now() < endsAt) return "closed";
    return myRatings.has(EVENT_FEEDBACK_KEY) ? "done" : "rate";
  };

  /** Preenche containerEl com o bloco de avaliação (hero "Encerrado" e Minhas palestras). */
  function render(containerEl) {
    if (!containerEl) return;
    containerEl.dataset.eventFeedbackContainer = "";
    containerEl.innerHTML = eventFeedbackMarkup({ phase: phaseNow(), form });
  }

  rootEl.addEventListener("submit", async event => {
    const formEl = event.target.closest("[data-event-feedback-form]");
    if (!formEl) return;
    event.preventDefault();
    const container = formEl.closest("[data-event-feedback-container]");
    const submitBtn = formEl.querySelector("[type=submit]");
    submitBtn.disabled = true;
    const data = new FormData(formEl);
    const text = field => formEl.querySelector(`[name=${field}]`).value.trim();
    const aspects = Object.fromEntries(form.aspects.map(aspect => [aspect.id, Number(data.get(`aspect-${aspect.id}`))]).filter(([, value]) => value));
    const nps = data.get("event-nps");
    const optional = { name: text("name"), highlight: text("highlight"), improve: text("improve") };
    try {
      const uid = await window.firebaseClient.ensureAnonymousUid();
      await window.eventFeedbackRepository.add(uid, EVENT_FEEDBACK_KEY, {
        entryKey: EVENT_FEEDBACK_KEY,
        rating: Number(data.get("event-rating")),
        ...(Object.keys(aspects).length ? { aspects } : {}),
        ...(nps !== null ? { nps: Number(nps) } : {}),
        ...Object.fromEntries(Object.entries(optional).filter(([, value]) => value)),
      });
      myRatings.addAll([EVENT_FEEDBACK_KEY]);
      render(container);
      rootEl.dispatchEvent(new CustomEvent(FEEDBACK_CHANGED_EVENT));
    } catch {
      submitBtn.disabled = false;
      formEl.querySelector(".talk-feedback-error")?.remove();
      submitBtn.insertAdjacentHTML("beforebegin", `<p class="talk-feedback-error" role="alert">Não foi possível enviar agora. Confira sua conexão e tente de novo.</p>`);
    }
  });

  return { render };
}
