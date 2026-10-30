/** O quanto o dedo precisa andar para o lado (em px) para valer como deslizar. */
const SWIPE_MIN_PX = 50;

/**
 * Feature: a galeria de fotos do campus. `initVenuePhotoGallery(sectionEl, { photos, text, link, config, devMode, makeModal })` mostra a galeria (só em DEV até `config.public`, ver features/release-gate.js; fora da liberação a
 * seção some sem aviso), abre a foto ampliada num modal ao tocar nela e passa para a anterior/próxima (botões sobre a foto, setas do teclado e deslizar o dedo, voltando ao começo no fim). A foto `featured` vai primeiro.
 * Tudo por parâmetro: `makeModal` (padrão `createModal`, components/modal.js; só é criado na primeira foto aberta). Devolve se a galeria ficou visível.
 */
function initVenuePhotoGallery(sectionEl, { photos, text, link = null, config, devMode = false, makeModal = createModal }) {
  if (!sectionEl) return false;
  const visible = isReleased(config, { devMode }) && photos.length > 0;
  sectionEl.hidden = !visible;
  sectionEl.innerHTML = visible ? venuePhotoGalleryMarkup({ photos, text, link }) : "";
  if (!visible) return false;

  let modal = null;
  let current = 0;
  const show = index => {
    current = (index + photos.length) % photos.length;
    if (!modal) {
      modal = makeModal("venuePhotoModal", { label: text.open });
      modal.el.addEventListener("click", event => {
        const step = event.target.closest("[data-photo-step]");
        if (step) show(current + Number(step.dataset.photoStep));
      });
      let touchStartX = null; // deslizar o dedo para o lado também troca de foto
      modal.el.addEventListener("touchstart", event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
      modal.el.addEventListener("touchend", event => {
        const moved = touchStartX === null ? 0 : event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(moved) >= SWIPE_MIN_PX) show(current + (moved < 0 ? 1 : -1));
      });
    }
    modal.openHTML(venuePhotoViewMarkup({ photos, index: current, text }));
  };
  sectionEl.addEventListener("click", event => {
    const tile = event.target.closest("[data-photo]");
    if (tile) show(photos.findIndex(photo => photo.id === tile.dataset.photo));
  });
  document.addEventListener("keydown", event => {
    if (!modal || modal.el.hidden || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    show(current + (event.key === "ArrowRight" ? 1 : -1));
  });
  return true;
}

if (typeof module !== "undefined") module.exports = { initVenuePhotoGallery };
