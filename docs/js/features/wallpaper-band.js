/**
 * Feature: a faixa "Leve o DevFest no celular" da página principal: os fundos de tela mais novos em celulares e o botão pra página de fundos.
 * Só aparece quando liberada (`config.public`, ou no modo DEV: features/release-gate.js) e se houver fundos. Tudo por parâmetro: `config`
 * (data/wallpapers.js: `phones`, `href`), `wallpapers` (já ordenados do mais novo pro mais antigo), `text` (WALLPAPER_TEXTS). Devolve se a faixa apareceu.
 */
function initWallpaperBand(sectionEl, { config, wallpapers, text, devMode = false }) {
  const visible = isReleased(config, { devMode }) && wallpapers.length > 0;
  sectionEl.hidden = !visible;
  sectionEl.innerHTML = visible ? wallpaperBandMarkup({ wallpapers: wallpapers.slice(0, config.phones), text, total: wallpapers.length, href: config.href }) : "";
  return visible;
}
