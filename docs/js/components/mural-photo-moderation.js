/** Marcação da tela do moderador de fotos do mural (mural-fotos.html): o login (reusa moderator-login.js) e a grade das fotos mais novas do álbum, cada uma com "Tirar do ar" / "Voltar ao ar". `embedded` (dentro da área de admin, que já tem a conta e o título) omite a conta e o título. */
function muralPhotoModerationMarkup({ phase, email = "", albumLabel = "", message = "", photos = [], hidden = new Set(), pending = new Set(), formatTime = () => "", thumbUrl = photo => photo.url, embedded = false }) {
  const notice = message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "";
  if (phase === "signin") return `${moderatorSignInMarkup({ hint: "Entre com a conta Google de moderador pra tirar fotos do telão.", signInLabel: "Entrar com Google" })}${notice}`;
  const hiddenCount = photos.filter(photo => hidden.has(photo.id)).length;
  const tiles = photos.map(photo => {
    const isHidden = hidden.has(photo.id);
    return `<li class="mf-tile${isHidden ? " is-hidden" : ""}"><img src="${escapeHtml(thumbUrl(photo))}" alt="" loading="lazy"><span class="mf-time">${escapeHtml(formatTime(photo))}</span><button type="button" class="chip-btn${isHidden ? "" : " chip-btn--danger"}" data-photo-toggle="${escapeHtml(photo.id)}"${pending.has(photo.id) ? " disabled" : ""}>${isHidden ? "Voltar ao ar" : "Tirar do ar"}</button></li>`;
  }).join("");
  return `${embedded ? "" : `${moderatorAccountMarkup(email)}
    <h1 class="mod-title">Fotos do telão: ${escapeHtml(albumLabel)}</h1>`}
    <p class="mod-hint">${photos.length ? `As ${photos.length} fotos mais novas. ${hiddenCount ? `${hiddenCount} fora do ar.` : "Nenhuma fora do ar."} A foto sai do telão em instantes.` : "Nenhuma foto no álbum ainda."}</p>
    ${notice}<ul class="mf-grid">${tiles}</ul>`;
}

/** O que a tela mostra quando não dá pra moderar: álbum que não existe (lista os que existem) ou intermediário de álbuns desligado. */
function muralPhotoModerationUnavailableMarkup({ hasAlbum, albumIds = [] }) {
  return `<p class="mod-hint">${hasAlbum ? "O intermediário de álbuns ainda não está ligado (MURAL_CONFIG.albums.proxyUrl)." : `Álbum desconhecido. Use <code>?album=</code> com um destes: ${albumIds.map(escapeHtml).join(", ")}.`}</p>`;
}
