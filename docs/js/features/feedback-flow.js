/**
 * Composição do feedback numa página que tem o modal de palestra: liga
 * feedback por palestra, do evento, "Minhas palestras", o aviso "avalie" e
 * o botão do cabeçalho. Existe pra as 3 páginas com modal (Home, Grade,
 * Palestrantes) não repetirem essa fiação. Repositories e relógio entram por
 * parâmetro (com os globais do site como padrão). Em PROD (line-up ainda
 * mock, `reveal` falso) só o feedback do evento fica ativo.
 */
function initFeedbackFlow({
  calendar,
  reveal,
  createModal,
  schedule = SCHEDULE,
  event = EVENT,
  now = resolveNow(),
  myCheckins = myCheckinsRepository,
  myRatings = myRatingsRepository,
  form = eventFeedbackFormRepository.getAll(),
}) {
  const index = calendar.index;
  const endsAt = schedule[schedule.length - 1].end;
  const startsAt = schedule[0].start;
  const feedback = initTalkFeedback(document.body, { index, reveal, now, myCheckins, myRatings });
  const eventFeedback = initEventFeedback(document.body, { form, myRatings, now, endsAt });
  if (!reveal) return { feedback, eventFeedback };

  const myTalks = initMyTalks({ rootEl: document.body, index, feedback, eventFeedback, myCheckins, myRatings, createModal, timezone: event.timezone });
  initFeedbackNudge({ index, myCheckins, myRatings, now, endsAt, onOpen: myTalks.open });

  const headerTop = document.querySelector(".header-top");
  if (headerTop) {
    headerTop.insertAdjacentHTML("beforeend", `<button type="button" class="chip-btn header-feedback-btn" data-my-talks-open data-track-event="my_talks_open" hidden>${iconMarkup("star")}Avaliar</button>`);
    const button = headerTop.querySelector(".header-feedback-btn");
    const syncButton = () => { button.hidden = now() < startsAt; };
    syncButton();
    setInterval(syncButton, 60000);
  }
  return { feedback, eventFeedback, myTalks };
}
