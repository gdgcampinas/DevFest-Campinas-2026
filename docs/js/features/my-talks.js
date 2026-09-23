/**
 * Feature: "Minhas palestras". Lista o que a pessoa assistiu (check-ins
 * guardados neste navegador), com avaliação inline de cada uma e a do
 * evento no fim. Reusa `feedback.render` e `eventFeedback.render` (o mesmo
 * bloco do modal da palestra e do hero "Encerrado"), sem duplicar formulário.
 * Abre por qualquer [data-my-talks-open], por `?avaliar=1` e pelo aviso
 * "avalie". Tudo injetado; nenhum acesso ao Firebase aqui.
 */
function initMyTalks({ rootEl, index, feedback, eventFeedback, myCheckins, myRatings, createModal, timezone, openParam = "avaliar" }) {
  let modal = null;
  const ensureModal = () => modal ?? (modal = createModal("myTalksModal", { label: "Minhas palestras" }));

  const watched = () => myCheckins.getAll().map(key => index.get(key)).filter(Boolean).sort((a, b) => a.slot.start - b.slot.start);

  const updateProgress = () => {
    const progressEl = modal?.el.querySelector("[data-my-talks-progress]");
    const items = watched();
    if (progressEl) progressEl.textContent = `${items.filter(entry => myRatings.has(entry.key)).length} de ${items.length} avaliadas`;
  };

  function open() {
    const { el, openHTML } = ensureModal();
    const entries = watched();
    openHTML(myTalksMarkup({
      done: entries.filter(entry => myRatings.has(entry.key)).length,
      items: entries.map(entry => ({
        key: entry.key,
        title: entry.data.title,
        timeLabel: timeRangeLabel(entry.slot, timezone),
        trackLabel: entry.track.label,
        color: entry.track.color,
      })),
    }));
    const containers = [...el.querySelectorAll("[data-my-talk-container]")];
    entries.forEach(entry => feedback.render(containers.find(container => container.dataset.myTalkContainer === entry.key), entry));
    eventFeedback.render(el.querySelector("[data-my-talks-event]"));
  }

  rootEl.addEventListener("click", event => {
    if (event.target.closest("[data-my-talks-open]")) open();
  });
  rootEl.addEventListener(FEEDBACK_CHANGED_EVENT, updateProgress);
  if (getParam(openParam)) open();

  return { open };
}
