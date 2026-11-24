/**
 * A JANELA do convite para o álbum ao vivo (regra PURA, dual: navegador e Node, testada em DevFestIA/tools/mural/photo-invite-window.test.js): o convite só aparece de `window.from` até `window.until`
 * (data/photo-invite.js: ISO com fuso). Devolve "before" (ainda não abriu), "open" ou "closed" (fechado, ou ainda não liberado em produção).
 * Ordem das regras: `open: false` fecha na hora (interruptor manual); `devMode` abre fora da janela, só pra testar; `public: false` mantém fechado em produção (features/release-gate.js); por fim, o relógio.
 */
function photoInvitePhase(now, config, { devMode = false } = {}) {
  if (config.open === false) return "closed";
  if (devMode) return "open";
  if (!isReleased(config)) return "closed";
  const time = now.getTime();
  if (time < Date.parse(config.window.from)) return "before";
  if (time >= Date.parse(config.window.until)) return "closed";
  return "open";
}

/** O endereço do botão: o convite do álbum pelo intermediário. Sem intermediário configurado devolve "" (o convite não aparece). */
function photoInviteHref({ proxyUrl, albumId }) {
  return proxyUrl && albumId ? `${proxyUrl.replace(/\/+$/, "")}/join/${encodeURIComponent(albumId)}` : "";
}

if (typeof module !== "undefined") module.exports = { photoInvitePhase, photoInviteHref };
