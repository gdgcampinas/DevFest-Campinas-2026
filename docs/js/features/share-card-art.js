/**
 * Peças de desenho do cartão "Eu vou!" que a arte pronta não tem: a faixa com o NOME da pessoa. Só DESENHA (nenhum acesso a DOM, repository ou rede; o contexto 2D, a caixa e as cores vêm por
 * parâmetro), então dá pra testar com um contexto de mentira.
 */

/** Diminui a fonte até o texto caber na largura (nome comprido não vaza da faixa). */
function fitFontSize(ctx, text, maxWidth, { weight = 700, size, family, minSize = 22 }) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && current > minSize) {
    current -= 2;
    ctx.font = `${weight} ${current}px ${family}`;
  }
  return current;
}

/**
 * A faixa "NOME vai!" no estilo da etiqueta "EU VOU!" da arte: cantos redondos, borda e ponto na cor de destaque, texto em maiúsculas. `box` = { x, y, height, maxWidth, fontSize } (data/share-card-design.js);
 * a largura acompanha o texto (até `maxWidth`).
 */
function drawNamePill(ctx, { text, box, font, accent, bg }) {
  const pad = box.height * 0.42;
  const dot = box.height * 0.1;
  const size = fitFontSize(ctx, text, box.maxWidth - pad * 2 - dot * 3, { size: box.fontSize, family: font });
  const width = Math.min(box.maxWidth, ctx.measureText(text).width + pad * 2 + dot * 3);
  ctx.save();
  ctx.fillStyle = bg;
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, width, box.height, box.height / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(box.x + pad, box.y + box.height / 2, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = `700 ${size}px ${font}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, box.x + pad + dot * 3, box.y + box.height / 2 + 2);
  ctx.restore();
}

if (typeof module !== "undefined") module.exports = { fitFontSize, drawNamePill };
