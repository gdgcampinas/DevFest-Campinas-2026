/**
 * Feature: aviso "avalie". A cada `intervalMs`, se houver palestra em que a
 * pessoa fez check-in, que já terminou e ainda não foi avaliada (ou o evento
 * terminou e não foi avaliado), mostra uma barra fixa com o botão que abre
 * "Minhas palestras". "✕" esconde por `snoozeMs`. Tudo injetado
 * (repositories locais, relógio, o que fazer ao abrir).
 */
function initFeedbackNudge({ index, myCheckins, myRatings, now = () => new Date(), endsAt, onOpen, mountEl = document.body, intervalMs = 20000, snoozeMs = 15 * 60000 }) {
  const el = document.createElement("div");
  el.className = "feedback-nudge";
  el.hidden = true;
  mountEl.appendChild(el);
  let snoozedUntil = 0;

  function tick() {
    const pending = myCheckins.getAll().map(key => index.get(key))
      .filter(entry => entry && entry.slot.end <= now() && !myRatings.has(entry.key))
      .sort((a, b) => b.slot.end - a.slot.end);
    const eventPending = now() >= endsAt && !myRatings.has(EVENT_FEEDBACK_KEY);
    const modalOpen = Boolean(document.querySelector(".modal:not([hidden])"));
    if ((!pending.length && !eventPending) || Date.now() < snoozedUntil || modalOpen) {
      el.hidden = true;
      return;
    }
    el.innerHTML = feedbackNudgeMarkup({ title: pending[0]?.data.title, more: Math.max(0, pending.length - 1), eventPending });
    el.hidden = false;
  }

  el.addEventListener("click", event => {
    if (event.target.closest("[data-nudge-open]")) {
      el.hidden = true;
      onOpen();
    } else if (event.target.closest("[data-nudge-dismiss]")) {
      snoozedUntil = Date.now() + snoozeMs;
      el.hidden = true;
    }
  });
  document.addEventListener(FEEDBACK_CHANGED_EVENT, tick);
  document.addEventListener("click", () => setTimeout(tick, 0)); // abrir/fechar um modal muda a visibilidade
  tick();
  setInterval(tick, intervalMs);
  return { tick };
}
