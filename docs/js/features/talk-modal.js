/**
 * Feature: modal de detalhe da palestra + infraestrutura genérica de
 * modal reaproveitada por qualquer outro conteúdo (galerias etc).
 * Abre ao clicar num card clicável (data-slot-index), busca os dados
 * no schedule por índice + trilha — não duplica nada do card, só
 * formata maior via talkDetailMarkup (components/track-card.js).
 */
function createTalkModal(modalEl, contentEl) {
  function openHTML(html) {
    contentEl.innerHTML = html;
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function open(track, data, meta) {
    openHTML(talkDetailMarkup(track, data, meta));
  }

  function close() {
    modalEl.hidden = true;
    document.body.style.overflow = "";
  }

  modalEl.addEventListener("click", event => {
    if (event.target.closest(".modal-close") || event.target.classList.contains("modal-backdrop")) close();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modalEl.hidden) close();
  });

  return { open, openHTML, close };
}

/**
 * Delega clique em qualquer .talk[data-slot-index] dentro de rootEl
 * (agenda completa ou hero "ao vivo") e abre o modal com os dados reais
 * daquele slot/trilha — funciona pros dois sem duplicar handler.
 */
function initTalkDetails(rootEl, { schedule, tracks, timezone, reveal, modal }) {
  rootEl.addEventListener("click", event => {
    const card = event.target.closest(".talk[data-slot-index]");
    if (!card) return;
    openFromCard(card);
  });
  rootEl.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".talk[data-slot-index]");
    if (!card) return;
    event.preventDefault();
    openFromCard(card);
  });

  function openFromCard(card) {
    const slot = schedule[Number(card.dataset.slotIndex)];
    const track = tracks.find(t => t.id === card.dataset.track);
    if (!slot || !track || !slot.talks) return;
    modal.open(track, slot.talks[track.id], {
      reveal,
      timeRange: timeRangeLabel(slot, timezone),
      room: track.room,
    });
  }
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
    ? `<button class="menu-nav prev" aria-label="Anterior">‹</button>
       <button class="menu-nav next" aria-label="Próximo">›</button>
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
