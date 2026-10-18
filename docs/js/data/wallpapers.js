/**
 * Fundos de tela de celular do evento (1080x2340 de proporção, feitos pela organização), só dado: cada fundo tem o arquivo pra baixar e a miniatura (assets/img/wallpapers/). `public: false` mostra a página
 * só em modo DEV (pra conferir); `true` libera em produção (ver wallpapersVisible, features/wallpapers.js). Os textos são traduzidos por igualdade (data/i18n/en.js); nada daqui é HTML.
 */
const WALLPAPERS_CONFIG = {
  public: false,
};

const WALLPAPERS = [
  { id: "guarda-chuvas", title: "Rua dos guarda-chuvas" },
  { id: "lagoa-do-taquaral", title: "Lagoa do Taquaral" },
  { id: "campinas-entardecer", title: "Campinas ao entardecer" },
].map(item => ({
  ...item,
  image: `assets/img/wallpapers/fundo-${item.id}.jpg`,
  thumb: `assets/img/wallpapers/fundo-${item.id}-thumb.webp`,
  filename: `devfest-campinas-2026-fundo-${item.id}.jpg`,
}));

const WALLPAPER_TEXTS = {
  title: "Fundos de tela",
  sub: "Leve o DevFest Campinas 2026 no seu celular. Escolha um fundo e baixe.",
  download: "Baixar fundo",
  photoOf: "Fundo de tela",
  soon: "Os fundos de tela do evento chegam em breve.",
  tip: "No celular: abra a imagem, toque e segure e escolha \"Salvar\" (ou \"Baixar\"). Depois defina como papel de parede.",
};

const wallpapersRepository = createRepository(WALLPAPERS, {
  getById: id => WALLPAPERS.find(item => item.id === id),
});
const wallpaperTextsRepository = createRepository(WALLPAPER_TEXTS);
const wallpapersConfigRepository = createRepository(WALLPAPERS_CONFIG);
