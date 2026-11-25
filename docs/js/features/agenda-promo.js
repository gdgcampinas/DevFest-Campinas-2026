/**
 * Feature: a DIVULGAÇÃO da "Minha agenda" no site (cartão da home, dica na Grade e em Palestrantes, selo "Novo" no botão). Tudo por parâmetro e injetável:
 *   createAgendaPromo   `isOpen()`, `cardMarkup()`, `tipMarkup(key)` e `badgeMarkup()` (vazios quando fechado) e `opensMyAgenda()`; `text`, `config`, `favorites` (repository de favoritos: `count()`),
 *                       `devMode()`, `now()`, `savedLabel(count)` e `search()` (a query da página) entram de fora. Quem ainda não salvou nada vê "Monte sua agenda" (leva à Grade para montar);
 *                       quem já salvou vê a contagem e "Abrir minha agenda" (leva à Grade JÁ no filtro "Minha agenda", `?<openParam>=1`). `opensMyAgenda()` diz se a página foi aberta assim
 *   defaultAgendaPromo  monta com as peças do site (config, frases, favoritos, relógio simulado `?demo=`, modo DEV)
 * Regra de abrir (a mesma de toda coisa nova, features/release-gate.js): `open: false` fecha sempre; `public: false` só no modo DEV. Cada espaço da página redesenha sozinho quando os favoritos mudam (initInviteSlot `subscribe`).
 */
function createAgendaPromo({ text, config, favorites, devMode = () => false, now = () => new Date(), savedLabel = count => String(count), search = () => "" }) {
  const browseHref = config.gradeHref;
  const mineHref = `${config.gradeHref}?${config.openParam}=1`;
  const isOpen = () => config.open !== false && isReleased(config, { devMode: devMode() });
  const whenOpen = build => () => (isOpen() ? build() : "");
  const hasSaved = () => favorites.count() > 0;
  return {
    isOpen,
    cardMarkup: whenOpen(() => (hasSaved()
      ? agendaPromoCardMarkup({ title: text.savedTitle, text: savedLabel(favorites.count()), button: text.savedButton, href: mineHref })
      : agendaPromoCardMarkup({ title: text.cardTitle, text: text.cardText, button: text.cardButton, href: browseHref }))),
    /** `key` = a frase em `text` (gradeTip, speakersTip); a dica é pra quem ainda não salvou nada e some depois da primeira estrela. */
    tipMarkup: key => whenOpen(() => (hasSaved() ? "" : agendaPromoTipMarkup({ text: text[key] })))(),
    opensMyAgenda: () => new URLSearchParams(search()).get(config.openParam) === "1",
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
    search: () => location.search,
    savedLabel: count => tn("agenda.saved", count, "{count} palestra salva", "{count} palestras salvas"),
  });
}
