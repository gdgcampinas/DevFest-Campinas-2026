/**
 * Cartão pessoal "Eu vou!" — sem backend. A arte é uma imagem pronta do design (assets/img/share-card/, escolhida por idioma em data/share-card-design.js); a pessoa só acrescenta o nome. Duas
 * camadas, mesmo princípio de live-status.js:
 *   drawShareCard() → só desenha no canvas recebido (a arte e a faixa com o nome, peças em features/share-card-art.js)
 *   initShareCard() → comportamento: abre o modal, redesenha ao digitar o nome, baixa ou compartilha o PNG gerado
 * Cores e fonte vêm dos design tokens (getComputedStyle), nunca fixas.
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

/**
 * Desenha o cartão (formato feed/stories, 1080x1350) no canvas recebido: a ARTE PRONTA (assets/img/share-card/, feita no design: fênix, trilhas, data, logos) e, se a pessoa digitou o nome, a faixa
 * "NOME vai!" por cima, numa área livre da arte. Tudo por parâmetro: `template` (imagem já carregada; sem ela o cartão fica só com o fundo), `design` (data/share-card-design.js) e `texts`
 * ({ nameGoes }, já traduzido). As cores vêm dos tokens (getComputedStyle), nunca hex fixo.
 */
function drawShareCard(canvas, { template = null, name = "", texts, design = SHARE_CARD_DESIGN }) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.fillStyle = cssToken("--bg");
  ctx.fillRect(0, 0, width, height);
  if (template) ctx.drawImage(template, 0, 0, width, height);
  if (name) drawNamePill(ctx, { text: texts.nameGoes.replace("{name}", name).toUpperCase(), box: design.namePill, font: cssToken("--font-display"), accent: cssToken("--accent"), bg: cssToken("--bg") });
}

/**
 * Comportamento do modal: abrir, redesenhar ao digitar, baixar ou
 * compartilhar.
 *
 * `gate` (opcional, ver features/registration-gate.js): se vier e a
 * inscrição ainda não foi verificada neste navegador, o modal pede o
 * e-mail do Sympla antes de mostrar o cartão. Sem `gate` o cartão é livre.
 * `?cartao=1` na URL abre o modal sozinho (link do e-mail de confirmação).
 */
function initShareCard(rootEl, { event, createModal, gate = null, ticketButtonHtml = "", design = SHARE_CARD_DESIGN, locale = i18n.locale }) {
  let modal = null;
  let template = null;
  const redrawIfOpen = () => { if (modal && !modal.el.hidden) redraw(modal.el); };
  loadImage(design.templates[locale] ?? design.templates.default).then(image => { template = image; redrawIfOpen(); }); // o modal pode abrir antes da arte chegar
  document.fonts?.ready.then(redrawIfOpen); // a fonte do site pode chegar depois do primeiro desenho
  const ensureModal = () => modal ?? (modal = createModal("shareCardModal", { label: t("shareCard.modalLabel", "Cartão de compartilhamento") }));
  const texts = { nameGoes: t("shareCard.nameGoes", "{name} vai!") };

  function redraw(modalEl) {
    const canvas = modalEl.querySelector("[data-share-card-canvas]");
    if (!canvas) return; // o modal está no passo do e-mail (gate), ainda sem cartão
    const name = modalEl.querySelector("[data-share-card-name]").value.trim();
    drawShareCard(canvas, { template, name, texts, design });
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
