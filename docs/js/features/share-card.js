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
/** Carrega uma imagem (null se não houver `src` ou se falhar): o cartão desenha sem logo em vez de quebrar. */
function loadImage(src) {
  if (!src) return Promise.resolve(null);
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** Lê qualquer custom property de tokens.css (cor ou fonte) — nunca hex/fonte fixa aqui. */
function cssToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Desenha o cartão 1080x1350 (formato feed/stories) no canvas recebido. `logo` é uma imagem já carregada (opcional). */
function drawShareCard(canvas, { event, dateLabel, name = "", logo = null }) {
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
  if (logo) {
    const logoHeight = 84;
    ctx.drawImage(logo, 72, 70, (logo.naturalWidth / logo.naturalHeight) * logoHeight, logoHeight);
  } else {
    ctx.fillStyle = "#dfe3ea";
    ctx.font = `700 34px ${display}`;
    ctx.fillText("GDG Campinas", 72, 130);
  }

  ctx.fillStyle = cssToken("--accent");
  ctx.font = `700 52px ${display}`;
  ctx.fillText(name ? t("shareCard.nameGoes", "{name} vai!", { name }) : t("shareCard.going", "Eu vou!"), 72, 340);

  ctx.fillStyle = "#f4f5f8";
  wrapText(ctx, event.name.toUpperCase(), 72, 460, width - 144, 92, `700 88px ${display}`);
  ctx.fillText("2026", 72, 640);

  ctx.fillStyle = "#aab2c0";
  ctx.font = `500 38px ${body}`;
  ctx.fillText(`${dateLabel} · ${event.address}`, 72, 720);

  const tracks = [
    { label: t("shareCard.trackIa", "IA"), color: blue },
    { label: t("shareCard.trackWeb", "Front, Back e Data"), color: yellow },
    { label: t("shareCard.trackMobile", "Mobile e Agile"), color: green },
    { label: t("shareCard.trackCareers", "Carreiras e Mentorias"), color: red },
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
 * (features/agenda.js, mesma função do header e do ticker: "28 de
 * novembro de 2026" em 1 lugar só, nunca recalculada aqui).
 *
 * `gate` (opcional, ver features/registration-gate.js): se vier e a
 * inscrição ainda não foi verificada neste navegador, o modal pede o
 * e-mail do Sympla antes de mostrar o cartão. Sem `gate` o cartão é livre.
 * `?cartao=1` na URL abre o modal sozinho (link do e-mail de confirmação).
 */
function initShareCard(rootEl, { event, schedule, createModal, gate = null, ticketButtonHtml = "" }) {
  let modal = null;
  let logo = null;
  loadImage(event.hosts?.[0]?.logo).then(image => {
    logo = image;
    if (modal && !modal.el.hidden) redraw(modal.el); // o modal abriu antes do logo chegar
  });
  const ensureModal = () => modal ?? (modal = createModal("shareCardModal", { label: t("shareCard.modalLabel", "Cartão de compartilhamento") }));
  const dateLabel = eventDateLabel(schedule, event.timezone);

  function redraw(modalEl) {
    const canvas = modalEl.querySelector("[data-share-card-canvas]");
    if (!canvas) return; // o modal está no passo do e-mail (gate), ainda sem cartão
    const name = modalEl.querySelector("[data-share-card-name]").value.trim();
    drawShareCard(canvas, { event, dateLabel, name, logo });
  }

  function showCard({ el, openHTML }) {
    openHTML(shareCardModalMarkup());
    el.querySelector("[data-share-card-native]").hidden = typeof navigator.canShare !== "function";
    redraw(el);
  }

  function open() {
    const current = ensureModal();
    if (!gate || gate.isVerified()) return showCard(current);
    current.openHTML("");
    gate.mount(current.el.querySelector(".modal-content"), { onVerified: () => showCard(current), ticketButtonHtml });
  }

  rootEl.addEventListener("click", clickEvent => {
    if (clickEvent.target.closest("[data-share-card-open]")) return open();

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
        await navigator.share({ files: [file], title: event.name, text: t("shareCard.shareText", "Eu vou pro {event} 2026!", { event: event.name }) }).catch(() => {});
      });
    }
  });

  rootEl.addEventListener("input", inputEvent => {
    const nameInput = inputEvent.target.closest("[data-share-card-name]");
    if (nameInput) redraw(nameInput.closest(".modal"));
  });

  if (getParam("cartao")) runAfterModules(open);

  return { open };
}
