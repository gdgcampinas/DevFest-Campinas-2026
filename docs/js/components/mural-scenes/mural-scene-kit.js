/**
 * Pedaços de HTML que todas as cenas do mural reusam (cabeçalho e rótulo de horário), pra nenhuma cena repetir markup. Só texto escapado e
 * classes `ms-*` (css/mural.css); nada de estilo inline além de cor de trilha.
 */
function muralHeadMarkup({ kicker = "", title = "" }) {
  if (!kicker && !title) return "";
  return `<header class="ms-head">${kicker ? `<span class="ms-kicker">${escapeHtml(kicker)}</span>` : ""}${title ? `<h2 class="ms-title">${escapeHtml(title)}</h2>` : ""}</header>`;
}

/**
 * Atributo `style` pro item que entra em sequência (classe `ms-stagger`): `--i` é a posição, e o CSS espera `--stagger-step` por posição
 * (MURAL_CONFIG.motion.staggerMs). `extra` leva outras variáveis do item (ex.: a cor da trilha).
 */
function muralStagger(index, extra = "") {
  return ` style="--i:${index};${extra}"`;
}

/**
 * Como uma mídia (arte ou vídeo) se ENCAIXA em qualquer proporção de telão, por dado: `fit` e `focus` viram variáveis CSS (--fit, --focus e as versões por forma do palco:
 * --fit-tall, --focus-wide...) e o CSS escolhe pela forma (data-shape). Cada um pode ser um valor só ou um objeto por forma (`{ default, ultrawide, wide, standard, tall }`).
 * Devolve o texto do atributo `style`. Reusada pelas artes (data/mural-arts.js) e pelos vídeos (data/mural-videos.js).
 */
function muralFitVars({ fit = "cover", focus = "50% 50%" }) {
  const vars = [];
  const spread = (name, value) => {
    const entries = typeof value === "object" ? Object.entries(value) : [["default", value]];
    entries.forEach(([shape, item]) => vars.push(`--${name}${shape === "default" ? "" : `-${shape}`}:${item}`));
  };
  spread("fit", fit);
  spread("focus", focus);
  return vars.join(";");
}

/** Camada de ARTE em tela cheia (imagem desfocada ao fundo + a imagem), encaixada por `muralFitVars`. Reusada pela cena "art" e pelo fundo do selfie. */
function muralArtMarkup(art) {
  const url = escapeHtml(art.file);
  return `<div class="ms-art-bg" style="background-image:url('${url}')"></div><img class="ms-art-img" src="${url}" alt="${escapeHtml(art.alt ?? "")}" style="${muralFitVars(art)}">`;
}

/** Etiqueta do álbum (nome, bolinha "ao vivo" e um selo opcional como "Nova foto da galera"). */
function muralAlbumCaptionMarkup({ label, live = false, badge = "" }) {
  return `<p class="ms-album-caption">${live ? '<i class="ms-live-dot" aria-hidden="true"></i>' : ""}<span>${escapeHtml(label)}</span>${badge ? `<b>${escapeHtml(badge)}</b>` : ""}</p>`;
}

/** Quadro de foto de um modelo de álbum; `index` é a ordem de entrada em fila (`ms-stagger`) e `extra` outras variáveis de estilo (ex.: o giro do polaroide). */
function muralAlbumTileMarkup(url, index, extra = "") {
  return `<figure class="ms-album-tile ms-stagger"${muralStagger(index, extra)}><img src="${escapeHtml(url)}" alt=""></figure>`;
}

/** "09:00 às 09:40", sempre em 24 h no fuso do evento. */
function muralTimeRange(start, end, timezone) {
  return `${formatEventTime(start, timezone)} às ${formatEventTime(end, timezone)}`;
}

/** Texto cortado numa palavra inteira, com reticências, pra caber na cena (mini-bio, frase longa). Texto que já cabe volta igual. */
function muralShorten(text, max) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,.;:!?-]+$/, "")}…`;
}

/** O Gumbleton (mascote) numa cena: a imagem é a de data/brand.js, passada já resolvida (`url`); imagem que não carrega some sozinha. `className` é o tamanho/posição da cena. */
function muralMascotMarkup(url, className) {
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(url)}" alt="" onerror="this.remove()">`;
}
