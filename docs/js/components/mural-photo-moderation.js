/**
 * Separa as fotos do álbum com aprovação em três grupos: PENDENTES (nem aprovada nem escondida: esperam o moderador), NO AR (aprovada e não escondida) e FORA DO AR (escondida: recusada ou tirada do ar;
 * "Voltar ao ar" aprova de novo). Puro. Alimenta as abas da tela de fotos.
 */
function photoApprovalGroups({ photos, approved = new Set(), hidden = new Set() }) {
  return {
    pending: photos.filter(photo => !approved.has(photo.id) && !hidden.has(photo.id)),
    live: photos.filter(photo => approved.has(photo.id) && !hidden.has(photo.id)),
    off: photos.filter(photo => hidden.has(photo.id)),
  };
}

const PHOTO_TABS = [{ id: "pending", label: "Pendentes" }, { id: "live", label: "No ar" }, { id: "off", label: "Fora do ar" }];

const photoTileMarkup = ({ photo, thumbUrl, formatTime, busy, off = false, actions }) =>
  `<li class="mf-tile${off ? " is-hidden" : ""}"><img src="${escapeHtml(thumbUrl(photo))}" alt="" loading="lazy"><span class="mf-time">${escapeHtml(formatTime(photo))}</span>${actions.map(action => `<button type="button" class="chip-btn${action.danger ? " chip-btn--danger" : ""}" ${action.attr}="${escapeHtml(photo.id)}"${busy ? " disabled" : ""}>${action.label}</button>`).join("")}</li>`;

/** Álbum com aprovação: as abas (com a contagem de cada uma), a frase de cada aba, o "Aprovar todas as pendentes" e a grade da aba aberta. */
function photoApprovalMarkup({ photos, approved, hidden, pending, tab, approvedReady, formatTime, thumbUrl }) {
  if (!approvedReady) return `<p class="mod-hint">Lendo as fotos aprovadas…</p>`;
  const groups = photoApprovalGroups({ photos, approved, hidden });
  const tabs = PHOTO_TABS.map(item => `<button type="button" class="mf-tab${item.id === tab ? " is-active" : ""}" data-mod-tab="${item.id}" aria-pressed="${item.id === tab}">${item.label} · ${groups[item.id].length}</button>`).join("");
  const hint = {
    pending: groups.pending.length ? "Fotos novas do álbum ao vivo. Nada vai ao telão sem você aprovar." : "Nenhuma foto esperando. As novas aparecem aqui sozinhas.",
    live: groups.live.length ? `As ${groups.live.length} fotos aprovadas. A foto sai do telão em instantes.` : "Nenhuma foto aprovada ainda.",
    off: groups.off.length ? "Fotos recusadas ou tiradas do ar. Voltar ao ar aprova a foto de novo." : "Nenhuma foto fora do ar.",
  }[tab];
  const actions = {
    pending: [{ attr: "data-photo-approve", label: "Aprovar" }, { attr: "data-photo-reject", label: "Recusar", danger: true }],
    live: [{ attr: "data-photo-takedown", label: "Tirar do ar", danger: true }],
    off: [{ attr: "data-photo-restore", label: "Voltar ao ar" }],
  }[tab];
  const tiles = groups[tab].map(photo => photoTileMarkup({ photo, thumbUrl, formatTime, busy: pending.has(photo.id), off: tab === "off", actions })).join("");
  const approveAll = tab === "pending" && groups.pending.length ? `<button type="button" class="chip-btn mf-approve-all" data-approve-all>Aprovar todas as pendentes</button>` : "";
  return `<div class="mf-toolbar"><div class="mf-tabs">${tabs}</div>${approveAll}</div><p class="mod-hint">${hint}</p><ul class="mf-grid">${tiles}</ul>`;
}

/** Marcação da tela do moderador de fotos do mural (mural-fotos.html): o login (reusa moderator-login.js) e as fotos mais novas do álbum. Álbum com aprovação (`approval`): abas Pendentes, No ar e Fora do ar; sem aprovação: uma grade com "Tirar do ar" / "Voltar ao ar". `embedded` (dentro da área de admin, que já tem a conta e o título) omite a conta e o título. */
function muralPhotoModerationMarkup({ phase, email = "", albumLabel = "", message = "", photos = [], hidden = new Set(), approved = new Set(), approval = false, approvedReady = true, tab = "pending", pending = new Set(), formatTime = () => "", thumbUrl = photo => photo.url, embedded = false }) {
  const notice = message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "";
  if (phase === "signin") return `${moderatorSignInMarkup({ hint: "Entre com a conta Google de moderador pra tirar fotos do telão.", signInLabel: "Entrar com Google" })}${notice}`;
  const head = embedded ? "" : `${moderatorAccountMarkup(email)}
    <h1 class="mod-title">Fotos do telão: ${escapeHtml(albumLabel)}</h1>`;
  if (approval) return `${head}${notice}${photos.length ? photoApprovalMarkup({ photos, approved, hidden, pending, tab, approvedReady, formatTime, thumbUrl }) : `<p class="mod-hint">Nenhuma foto no álbum ainda.</p>`}`;
  const hiddenCount = photos.filter(photo => hidden.has(photo.id)).length;
  const tiles = photos.map(photo => {
    const isHidden = hidden.has(photo.id);
    return photoTileMarkup({ photo, thumbUrl, formatTime, busy: pending.has(photo.id), off: isHidden, actions: [{ attr: "data-photo-toggle", label: isHidden ? "Voltar ao ar" : "Tirar do ar", danger: !isHidden }] });
  }).join("");
  return `${head}
    <p class="mod-hint">${photos.length ? `As ${photos.length} fotos mais novas. ${hiddenCount ? `${hiddenCount} fora do ar.` : "Nenhuma fora do ar."} A foto sai do telão em instantes.` : "Nenhuma foto no álbum ainda."}</p>
    ${notice}<ul class="mf-grid">${tiles}</ul>`;
}

/** O que a tela mostra quando não dá pra moderar: álbum que não existe (lista os que existem) ou intermediário de álbuns desligado. */
function muralPhotoModerationUnavailableMarkup({ hasAlbum, albumIds = [] }) {
  return `<p class="mod-hint">${hasAlbum ? "O intermediário de álbuns ainda não está ligado (MURAL_CONFIG.albums.proxyUrl)." : `Álbum desconhecido. Use <code>?album=</code> com um destes: ${albumIds.map(escapeHtml).join(", ")}.`}</p>`;
}
