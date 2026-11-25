/**
 * Feature: a DIVULGAÇÃO da "Minha agenda" no site (cartão da home, dica na Grade e em Palestrantes, selo "Novo" no botão). Tudo por parâmetro e injetável:
 *   createAgendaPromo   `isOpen()`, `cardMarkup()`, `tipMarkup(key)` e `badgeMarkup()` (vazios quando fechado); `text`, `config`, `favorites` (repository de favoritos: `count()`),
 *                       `devMode()`, `now()`, `savedLabel(count)` e `href` entram de fora. A pessoa que ainda não salvou nada vê o convite; quem já salvou vê a contagem e "Abrir minha agenda"
 *   defaultAgendaPromo  monta com as peças do site (config, frases, favoritos, relógio simulado `?demo=`, modo DEV)
 * Regra de abrir (a mesma de toda coisa nova, features/release-gate.js): `open: false` fecha sempre; `public: false` só no modo DEV. Cada espaço da página redesenha sozinho quando os favoritos mudam (initInviteSlot `subscribe`).
 */
function createAgendaPromo({ text, config, favorites, devMode = () => false, now = () => new Date(), savedLabel = count => String(count), href = "grade.html" }) {
  const isOpen = () => config.open !== false && isReleased(config, { devMode: devMode() });
  const whenOpen = build => () => (isOpen() ? build() : "");
  const hasSaved = () => favorites.count() > 0;
  return {
    isOpen,
    cardMarkup: whenOpen(() => (hasSaved()
      ? agendaPromoCardMarkup({ title: text.savedTitle, text: savedLabel(favorites.count()), button: text.savedButton, href })
      : agendaPromoCardMarkup({ title: text.cardTitle, text: text.cardText, button: text.cardButton, href }))),
    /** `key` = a frase em `text` (gradeTip, speakersTip); a dica é pra quem ainda não salvou nada e some depois da primeira estrela. */
    tipMarkup: key => whenOpen(() => (hasSaved() ? "" : agendaPromoTipMarkup({ text: text[key] })))(),
    badgeMarkup: whenOpen(() => (now().getTime() < Date.parse(config.badgeUntil) ? agendaPromoBadgeMarkup({ text: text.badge }) : "")),
  };
}

function defaultAgendaPromo() {
  return createAgendaPromo({
    text: agendaPromoTextsRepository.getAll(),
    config: agendaPromoConfigRepository.getAll(),
    favorites: favoritesRepository,
    devMode: isDevModeStored,
    now: resolveNow(),
    savedLabel: count => tn("agenda.saved", count, "{count} palestra salva", "{count} palestras salvas"),
  });
}
