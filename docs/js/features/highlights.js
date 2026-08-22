/**
 * Feature: "veja como foi" — grid de fotos que abre no modal genérico
 * (mesma infra de galeria usada em estacionamento/cardápio). Some
 * sozinha enquanto não houver fotos.
 */
function highlightsThumbGridMarkup(photos) {
  return photos.map(p => `<img class="highlight-thumb" src="${p.file}" alt="${p.alt}" loading="lazy">`).join("");
}

function renderHighlights(highlights, sectionEl, gridEl, modal) {
  const hasPhotos = highlights.photos.length > 0;
  sectionEl.hidden = !hasPhotos;
  if (!hasPhotos) return;
  sectionEl.querySelector("h2").textContent = highlights.title;
  gridEl.innerHTML = highlightsThumbGridMarkup(highlights.photos);
  gridEl.querySelectorAll(".highlight-thumb").forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      modal.openHTML(galleryMarkup(highlights.title, "", highlights.photos));
      // abre já na foto clicada — reaproveita o mesmo carrossel/dots do modal genérico.
      requestAnimationFrame(() => {
        const carousel = document.querySelector(".menu-carousel");
        if (!carousel) return;
        carousel.dataset.index = index;
        carousel.querySelector(".menu-track").style.transform = `translateX(-${index * 100}%)`;
        carousel.querySelectorAll(".menu-dots span").forEach((dot, i) => dot.classList.toggle("active", i === index));
      });
    });
  });
}
