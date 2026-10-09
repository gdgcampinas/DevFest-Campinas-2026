/**
 * Feature: os CONVITES pro mural de recados no site. Só aparecem DENTRO da janela de envio (features/wall-window.js: das 08:00 às 17:30 do dia do evento, e nunca com o interruptor `open: false`):
 *   createWallInvite       `isOpen()`, `cardMarkup()` e `linkMarkup()` (ambos vazios fora da janela); tudo por parâmetro: `config`, `text`, `phaseOf()`, `href`
 *   initWallInviteCard     o cartão da home: some e volta sozinho conforme a janela abre e fecha (confere a cada `refreshMs`, no `timer` injetado)
 *   defaultWallInvite      monta o convite com as peças do site (config, frases, relógio simulado `?demo=`, endereço de recado.html); home, grade e palestrantes usam esta
 */
function createWallInvite({ config, text, phaseOf, href }) {
  const isOpen = () => phaseOf() === "open";
  return {
    isOpen,
    cardMarkup: () => (isOpen() ? wallInviteCardMarkup({ text, href }) : ""),
    linkMarkup: () => (isOpen() ? wallInviteLinkMarkup({ text, href }) : ""),
  };
}

function initWallInviteCard(mountEl, { invite, timer = defaultSchedule, refreshMs = 30000 }) {
  return { stop: scheduleEvery(timer, refreshMs, () => {
    const markup = invite.cardMarkup();
    mountEl.hidden = !markup;
    mountEl.innerHTML = markup;
  }) };
}

function defaultWallInvite() {
  const config = wallConfigRepository.getAll();
  const now = resolveNow();
  return createWallInvite({ config, text: wallTextsRepository.getAll(), phaseOf: () => wallPhase(now(), config, { devMode: isDevModeStored() }), href: "recado.html" });
}
