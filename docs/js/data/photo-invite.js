/**
 * CONVITE PARA O ÁLBUM AO VIVO (só dado, sem lógica): o botão "Mande sua foto" no site (cartão da home, faixa da grade e aviso depois do check-in).
 * O botão leva ao convite do álbum colaborativo pelo intermediário (`<albums.proxyUrl>/join/<albumId>`, data/mural-config.js): o link do álbum nunca está no site.
 *   public     false = só no modo DEV até liberar (features/release-gate.js); true libera em produção, mas só dentro da janela (`window`)
 *   open       false fecha na hora, seja qual for o relógio ou o modo (interruptor manual)
 *   albumId    o álbum colaborativo ao vivo (data/mural-albums.js, `live: true`)
 *   window     quando o convite aparece: `from` e `until` (ISO com fuso). Hoje das 07:30 do dia do evento até a meia-noite (features/photo-invite-window.js)
 * As fotos passam pela moderação (aprovar antes de exibir), então o texto promete só isso, sem falar em telão.
 */
const PHOTO_INVITE = {
  public: false,
  open: true,
  albumId: "ao-vivo",
  window: { from: "2026-11-28T07:30:00-03:00", until: "2026-11-29T00:00:00-03:00" },
};

const PHOTO_INVITE_TEXTS = {
  cardTitle: "Mande sua foto do DevFest",
  cardText: "Para enviar fotos você precisa do app Google Fotos e de uma conta Google. Entre no álbum ao vivo e adicione suas fotos. A equipe aprova cada foto antes de ela ser exibida.",
  cardButton: "Entrar no álbum",
  bannerText: "Mande suas fotos pelo app Google Fotos. A equipe aprova antes de exibir.",
  bannerButton: "Enviar foto",
  afterCheckin: "Tirou uma foto?",
  afterCheckinButton: "Mande para o álbum ao vivo pelo app Google Fotos",
};

const photoInviteConfigRepository = createRepository(PHOTO_INVITE);
const photoInviteTextsRepository = createRepository(PHOTO_INVITE_TEXTS);
