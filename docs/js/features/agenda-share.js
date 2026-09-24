/**
 * Feature: compartilhar a "Minha agenda" por link, sem backend. O link
 * carrega os códigos curtos das palestras (?agenda=0945.ia,1030.mobile),
 * que o índice de palestras traduz de volta pras chaves de favorito.
 *
 *   initAgendaShare        → barra de ações (aparece com >= 1 favorito)
 *   initSharedAgendaBanner → quem abre o link vê um aviso e pode salvar
 */
const AGENDA_PARAM = "agenda";

function agendaShareUrl(codes, baseUrl) {
  return `${baseUrl}?${AGENDA_PARAM}=${codes.join(",")}`;
}

function agendaShareMessage(count, url) {
  return `Minha agenda no DevFest Campinas 2026 (${count} ${count === 1 ? "palestra" : "palestras"}): ${url}`;
}

function initAgendaShare({ mountEl, favorites, index, baseUrl }) {
  function render() {
    const entries = favorites.getAll().map(key => index.get(key)).filter(Boolean);
    mountEl.hidden = entries.length === 0;
    if (entries.length === 0) return;
    const url = agendaShareUrl(entries.sort((a, b) => a.slot.start - b.slot.start).map(entry => entry.code), baseUrl);
    mountEl.dataset.shareUrl = url;
    mountEl.innerHTML = agendaActionsMarkup({
      count: entries.length,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(agendaShareMessage(entries.length, url))}`,
    });
  }

  mountEl.addEventListener("click", event => {
    const copyBtn = event.target.closest("[data-agenda-copy]");
    if (!copyBtn) return;
    copyWithFeedback(mountEl.dataset.shareUrl, {
      labelEl: copyBtn.querySelector("span"),
      idleText: "Copiar link",
      promptText: "Copie o link da sua agenda:",
    });
  });

  favorites.subscribe(render);
  render();
}

/** Palestras válidas do link compartilhado (códigos desconhecidos são ignorados). */
function sharedAgendaKeys(search, index) {
  const raw = new URLSearchParams(search).get(AGENDA_PARAM);
  if (!raw) return [];
  return raw.split(",").map(code => index.getByCode(code)?.key).filter(Boolean);
}

function initSharedAgendaBanner({ bannerEl, favorites, index, onSaved = () => {} }) {
  const keys = sharedAgendaKeys(location.search, index);
  if (keys.length === 0) return;

  const dismiss = () => {
    bannerEl.hidden = true;
    const url = new URL(location.href);
    url.searchParams.delete(AGENDA_PARAM);
    history.replaceState(null, "", url);
  };

  bannerEl.hidden = false;
  bannerEl.innerHTML = `
    <span>Você abriu uma agenda compartilhada com <strong>${keys.length} ${keys.length === 1 ? "palestra" : "palestras"}</strong>.</span>
    <button type="button" class="chip-btn chip-btn--primary" data-shared-save data-track-event="shared_agenda_save">Salvar na minha agenda</button>
    <button type="button" class="chip-btn" data-shared-dismiss>Agora não</button>`;

  bannerEl.addEventListener("click", event => {
    if (event.target.closest("[data-shared-save]")) {
      favorites.addAll(keys);
      dismiss();
      onSaved();
    } else if (event.target.closest("[data-shared-dismiss]")) {
      dismiss();
    }
  });
}
