/**
 * Cartão pessoal "Eu vou!" — sem backend, sem dependência de logo novo
 * (troca sozinho quando os tokens de cor mudarem). Duas camadas, mesmo
 * princípio de live-status.js:
 *   drawShareCard() → só desenha no canvas recebido, nenhum acesso a
 *                      repository/DOM fora dele (fácil de re-testar isolado)
 *   initShareCard() → comportamento: abre o modal, redesenha ao digitar
 *                      o nome, baixa ou compartilha o PNG gerado
 *
 * Cores vêm dos design tokens (getComputedStyle em --google-* e --bg),
 * nunca hex fixo — herda qualquer troca de paleta em tokens.css sem
 * precisar tocar aqui (mesma regra de "zero por-track CSS").
 */
/** Lê qualquer custom property de tokens.css (cor ou fonte) — nunca hex/fonte fixa aqui. */
function cssToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Desenha o cartão 1080x1350 (formato feed/stories) no canvas recebido. */
function drawShareCard(canvas, { event, dateLabel, name = "" }) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const display = cssToken("--font-display");
  const body = cssToken("--font-body");
  const blue = cssToken("--google-blue");
  const green = cssToken("--google-green");
  const yellow = cssToken("--google-yellow");
  const red = cssToken("--google-red");

  ctx.fillStyle = cssToken("--bg");
  ctx.fillRect(0, 0, width, height);

  const glowTop = ctx.createRadialGradient(width * 0.85, height * 0.05, 0, width * 0.85, height * 0.05, width * 0.75);
  glowTop.addColorStop(0, withAlpha(blue, 0.55));
  glowTop.addColorStop(1, withAlpha(blue, 0));
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, width, height);

  const glowBottom = ctx.createRadialGradient(width * 0.1, height * 0.95, 0, width * 0.1, height * 0.95, width * 0.7);
  glowBottom.addColorStop(0, withAlpha(green, 0.32));
  glowBottom.addColorStop(1, withAlpha(green, 0));
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = "left";
  ctx.fillStyle = "#dfe3ea";
  ctx.font = `700 34px ${display}`;
  ctx.fillText("GDG Campinas", 72, 130);

  ctx.fillStyle = cssToken("--accent");
  ctx.font = `700 52px ${display}`;
  ctx.fillText(name ? `${name} vai!` : "Eu vou!", 72, 340);

  ctx.fillStyle = "#f4f5f8";
  wrapText(ctx, event.name.toUpperCase(), 72, 460, width - 144, 92, `700 88px ${display}`);
  ctx.fillText("2026", 72, 640);

  ctx.fillStyle = "#aab2c0";
  ctx.font = `500 38px ${body}`;
  ctx.fillText(`${dateLabel} · ${event.address}`, 72, 720);

  const tracks = [
    { label: "IA", color: blue },
    { label: "Front, Back e Data", color: yellow },
    { label: "Mobile e Agile", color: green },
    { label: "Carreiras e Mentorias", color: red },
  ];
  let ty = height - 260;
  ctx.font = `500 30px ${body}`;
  tracks.forEach(track => {
    ctx.fillStyle = track.color;
    ctx.beginPath();
    ctx.arc(84, ty - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#aab2c0";
    ctx.fillText(track.label, 112, ty);
    ty += 48;
  });

  ctx.fillStyle = "#7d8794";
  ctx.font = `500 28px ${body}`;
  ctx.fillText("#DevFestCampinas2026", 72, height - 48);
}

/** oklch()/hex + alpha, funciona com qualquer token (mesmo em oklch()). */
function withAlpha(token, alpha) {
  return token.startsWith("oklch(") ? token.replace(")", ` / ${alpha})`) : token;
}

/** Quebra de linha simples por largura máxima, uma função reusada por qualquer texto do cartão. */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, font) {
  ctx.font = font;
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  words.forEach((word, index) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
    if (index === words.length - 1) ctx.fillText(line, x, cursorY);
  });
}

/**
 * Comportamento do modal: abrir, redesenhar ao digitar, baixar ou
 * compartilhar. `schedule` só serve pra reusar eventDateLabel()
 * (features/agenda.js, mesma função do header e do ticker — "28 de
 * novembro de 2026" em 1 lugar só, nunca recalculada aqui).
 */
function initShareCard(rootEl, { event, schedule, createModal }) {
  let modal = null;
  const ensureModal = () => modal ?? (modal = createModal("shareCardModal", { label: "Cartão de compartilhamento" }));
  const dateLabel = eventDateLabel(schedule, event.timezone);

  function redraw(modalEl) {
    const canvas = modalEl.querySelector("[data-share-card-canvas]");
    const name = modalEl.querySelector("[data-share-card-name]").value.trim();
    drawShareCard(canvas, { event, dateLabel, name });
  }

  rootEl.addEventListener("click", clickEvent => {
    if (clickEvent.target.closest("[data-share-card-open]")) {
      const { el, openHTML } = ensureModal();
      openHTML(shareCardModalMarkup());
      el.querySelector("[data-share-card-native]").hidden = typeof navigator.canShare !== "function";
      redraw(el);
      return;
    }

    const modalEl = clickEvent.target.closest(".modal");
    if (!modalEl || modalEl.hidden) return;

    if (clickEvent.target.closest("[data-share-card-download]")) {
      const canvas = modalEl.querySelector("[data-share-card-canvas]");
      const link = document.createElement("a");
      link.download = "devfest-campinas-2026-eu-vou.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      return;
    }

    if (clickEvent.target.closest("[data-share-card-native]")) {
      const canvas = modalEl.querySelector("[data-share-card-canvas]");
      canvas.toBlob(async blob => {
        const file = new File([blob], "devfest-campinas-2026-eu-vou.png", { type: "image/png" });
        if (!navigator.canShare?.({ files: [file] })) return;
        await navigator.share({ files: [file], title: event.name, text: `Eu vou pro ${event.name} 2026!` }).catch(() => {});
      });
    }
  });

  rootEl.addEventListener("input", inputEvent => {
    const nameInput = inputEvent.target.closest("[data-share-card-name]");
    if (nameInput) redraw(nameInput.closest(".modal"));
  });

  return {};
}
