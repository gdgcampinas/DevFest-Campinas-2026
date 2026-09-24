/**
 * Feature: modal de detalhe da palestra, construído sobre o modal
 * genérico (components/modal.js), que também serve galerias etc.
 * Abre ao clicar num card clicável (data-slot-index), busca os dados
 * no schedule por índice + trilha — não duplica nada do card, só
 * formata maior via talkDetailMarkup (components/track-card.js).
 */
function createTalkModal() {
  const modal = createModal("talkModal", { label: t("talk.detail", "Detalhes da palestra") });

  function open(track, data, meta) {
    modal.openHTML(talkDetailMarkup(track, data, meta));
  }

  modal.el.addEventListener("click", event => {
    // link pra âncora da própria página (ex.: perfil do palestrante em palestrantes.html): fecha o modal
    const link = event.target.closest("a[href]");
    if (link && link.origin === location.origin && link.pathname === location.pathname) modal.close();
  });

  return { ...modal, open };
}

/**
 * Delega clique em qualquer [data-slot-index][data-track] dentro de rootEl
 * (agenda completa ou hero "ao vivo") e abre o modal com os dados reais
 * daquele slot/trilha — funciona pros dois sem duplicar handler.
 */
/** Controles dentro do card (estrela, LinkedIn) têm ação própria e não abrem o modal. */
const CARD_INNER_CONTROLS = ".fav-btn, a";
/** Qualquer elemento que aponte pra uma palestra (card da agenda, do hero ou da galeria de palestrantes). */
const TALK_TRIGGER = "[data-slot-index][data-track]";

function initTalkDetails(rootEl, { schedule, tracks, timezone, reveal, modal, favorites = null, calendar = null, feedback = null, questions = null }) {
  rootEl.addEventListener("click", event => {
    if (event.target.closest(CARD_INNER_CONTROLS)) return;
    const card = event.target.closest(TALK_TRIGGER);
    if (!card) return;
    openFromCard(card);
  });
  rootEl.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest(CARD_INNER_CONTROLS)) return;
    const card = event.target.closest(TALK_TRIGGER);
    if (!card) return;
    event.preventDefault();
    openFromCard(card);
  });

  /** Abre o modal da palestra (slot x trilha) e preenche os blocos de feedback e de perguntas dela. */
  function openTalk(slot, track) {
    if (!slot || !track || !slot.talks) return;
    const key = talkKey(slot, track.id);
    modal.open(track, slot.talks[track.id], {
      reveal,
      timeRange: timeRangeLabel(slot, timezone),
      room: track.room,
      talkKey: favorites ? key : "",
      favorite: favorites ? favorites.has(key) : false,
      calendarHtml: calendar ? calendarLinksMarkup({ googleUrl: googleCalendarLink(talkToCalendarEntry(calendar.index.get(key), calendar.event, calendar.siteUrl)), key }) : "",
    });
    const feedbackSlot = modal.el.querySelector(".talk-feedback-slot");
    const entry = calendar?.index?.get(key);
    if (feedback && entry && feedbackSlot) feedback.render(feedbackSlot, entry);
    const questionsSlot = modal.el.querySelector(".talk-questions-slot");
    if (questions && entry && questionsSlot) questions.render(questionsSlot, entry);
  }

  function openFromCard(card) {
    openTalk(schedule[Number(card.dataset.slotIndex)], tracks.find(t => t.id === card.dataset.track));
  }

  // QR de check-in escaneado (talk-feedback.js): depois do check-in, abre a própria palestra.
  rootEl.addEventListener(OPEN_TALK_EVENT, event => {
    const entry = calendar?.index?.get(event.detail.key);
    if (entry) openTalk(entry.slot, entry.track);
  });

  return { openTalk };
}

/**
 * Liga um card genérico (ex.: info-card com clickable:true) ao modal
 * genérico, abrindo o HTML retornado por markupFn — reusado por
 * qualquer galeria (cardápio, mapa do estacionamento etc), não só
 * palestra. Não faz nada se o card não existir ou não for clicável
 * (ex.: sem imagens ainda cadastradas).
 */
function initClickableCard(cardEl, modal, markupFn) {
  if (!cardEl || !cardEl.classList.contains("clickable")) return;
  const open = () => modal.openHTML(markupFn());
  cardEl.addEventListener("click", open);
  cardEl.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
}

/** Setas do carrossel de galeria — delegado no modal pra funcionar mesmo com conteúdo recriado a cada abertura. */
function initMenuCarousel(modalEl) {
  modalEl.addEventListener("click", event => {
    const btn = event.target.closest(".menu-nav");
    if (!btn) return;
    const carousel = btn.closest(".menu-carousel");
    const dots = carousel.querySelectorAll(".menu-dots span");
    const count = dots.length;
    const step = btn.classList.contains("next") ? 1 : -1;
    const index = (Number(carousel.dataset.index) + step + count) % count;
    carousel.dataset.index = index;
    carousel.querySelector(".menu-track").style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  });
}

/** Modal genérico de galeria (cardápio, mapa do estacionamento etc) — setas só aparecem com mais de 1 imagem. */
function galleryMarkup(title, subtitle, images) {
  const slides = images.map(m => `<img src="${m.file}" alt="${m.alt}" loading="lazy">`).join("");
  const nav = images.length > 1
    ? `<button class="menu-nav prev" aria-label="${t("gallery.prev", "Anterior")}">‹</button>
       <button class="menu-nav next" aria-label="${t("gallery.next", "Próximo")}">›</button>
       <div class="menu-dots">${images.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("")}</div>`
    : "";
  return `
    <div class="detail">
      <h3 class="detail-title">${title}</h3>
      <p class="detail-desc">${subtitle}</p>
      <div class="menu-carousel" data-index="0">
        <div class="menu-track">${slides}</div>
        ${nav}
      </div>
    </div>`;
}
