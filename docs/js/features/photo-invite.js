/**
 * Feature: os CONVITES pro álbum ao vivo no site. Só aparecem DENTRO da janela (features/photo-invite-window.js) e quando há endereço do convite:
 *   createPhotoInvite       `isOpen()`, `cardMarkup()`, `bannerMarkup()` e `linkMarkup()` (todos vazios fora da janela); tudo por parâmetro: `text`, `phaseOf()`, `href`
 *   defaultPhotoInvite      monta o convite com as peças do site (config, frases, relógio simulado `?demo=`, endereço pelo intermediário do mural); home e grade usam esta
 * O cartão e a faixa ficam num espaço da página que some e volta sozinho (features/invite-slot.js, `initInviteSlot`).
 */
function createPhotoInvite({ text, phaseOf, href }) {
  const isOpen = () => Boolean(href) && phaseOf() === "open";
  const when = build => () => (isOpen() ? build({ text, href }) : "");
  return { isOpen, cardMarkup: when(photoInviteCardMarkup), bannerMarkup: when(photoInviteBannerMarkup), linkMarkup: when(photoInviteLinkMarkup) };
}

function defaultPhotoInvite() {
  const config = photoInviteConfigRepository.getAll();
  const now = resolveNow();
  const href = photoInviteHref({ proxyUrl: muralConfigRepository.getAll().albums.proxyUrl, albumId: config.albumId });
  return createPhotoInvite({ text: photoInviteTextsRepository.getAll(), phaseOf: () => photoInvitePhase(now(), config, { devMode: isDevModeStored() }), href });
}
