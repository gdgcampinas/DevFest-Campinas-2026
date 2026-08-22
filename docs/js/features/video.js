/**
 * Feature: embed de vídeo do YouTube com fachada — mostra a thumbnail
 * (imagem leve, direto do YouTube) e só carrega o iframe pesado
 * depois do clique. Some a seção se não houver vídeo.
 */
function renderVideo(video, sectionEl, mountEl) {
  if (!video || !video.youtubeId) {
    sectionEl.hidden = true;
    return;
  }
  sectionEl.hidden = false;
  sectionEl.querySelector("h2").textContent = video.title;

  const thumb = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  mountEl.innerHTML = `
    <button class="video-facade" style="background-image:url('${thumb}')" aria-label="Reproduzir vídeo: ${video.title}">
      <span class="video-play">▶</span>
    </button>`;

  mountEl.querySelector(".video-facade").addEventListener("click", () => {
    mountEl.innerHTML = `<iframe src="https://www.youtube.com/embed/${video.youtubeId}?autoplay=1" title="${video.title}" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>`;
  }, { once: true });
}
