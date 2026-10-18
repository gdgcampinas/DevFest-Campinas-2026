/** Página: Fundos de tela de celular do evento (features/wallpapers.js). Só em DEV até `public: true` em data/wallpapers.js. */
function initFundosPage() {
  initShell("fundos");
  const text = wallpaperTextsRepository.getAll();
  document.getElementById("wpTitle").textContent = text.title;
  document.getElementById("wpSub").textContent = text.sub;
  renderWallpapers(document.getElementById("wpSection"), { config: wallpapersConfigRepository.getAll(), wallpapers: wallpapersRepository.getAll(), text, devMode: isDevModeStored() });
}

initFundosPage();
