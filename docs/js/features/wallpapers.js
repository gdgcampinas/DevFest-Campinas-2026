/**
 * Feature: a página de fundos de tela. `wallpapersVisible(config, { devMode })` é a regra (só em DEV até `public: true`); `renderWallpapers(sectionEl, { config, wallpapers, text, devMode })` mostra a galeria
 * ou o aviso "em breve". Tudo por parâmetro. Devolve se a galeria apareceu.
 */
const wallpapersVisible = (config, { devMode = false } = {}) => Boolean(config.public || devMode);

function renderWallpapers(sectionEl, { config, wallpapers, text, devMode = false }) {
  const visible = wallpapersVisible(config, { devMode }) && wallpapers.length > 0;
  sectionEl.innerHTML = visible ? wallpapersGalleryMarkup({ wallpapers, text }) : wallpapersSoonMarkup(text);
  return visible;
}

if (typeof module !== "undefined") module.exports = { wallpapersVisible };
