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
 * Camada de ARTE em tela cheia (imagem desfocada ao fundo + a imagem). Como a arte se encaixa vem do dado (data/mural-arts.js): `fit` e `focus` viram variáveis CSS
 * (--fit, --focus e as versões por forma do palco: --fit-tall, --focus-wide...) e o CSS escolhe pela forma (data-shape). Reusada pela cena "art" e pelo fundo do selfie.
 */
function muralArtMarkup(art) {
  const vars = [];
  const spread = (name, value) => {
    const entries = typeof value === "object" ? Object.entries(value) : [["default", value]];
    entries.forEach(([shape, item]) => vars.push(`--${name}${shape === "default" ? "" : `-${shape}`}:${item}`));
  };
  spread("fit", art.fit ?? "cover");
  spread("focus", art.focus ?? "50% 50%");
  const url = escapeHtml(art.file);
  return `<div class="ms-art-bg" style="background-image:url('${url}')"></div><img class="ms-art-img" src="${url}" alt="${escapeHtml(art.alt ?? "")}" style="${vars.join(";")}">`;
}

/** "09:00 às 09:40", sempre em 24 h no fuso do evento. */
function muralTimeRange(start, end, timezone) {
  return `${formatEventTime(start, timezone)} às ${formatEventTime(end, timezone)}`;
}
