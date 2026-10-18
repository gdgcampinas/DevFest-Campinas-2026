/**
 * Fundos de tela de celular do evento (1080x2340 de proporção, feitos pela organização), só dado: cada fundo tem o arquivo pra baixar e a miniatura (assets/img/wallpapers/). `public: false` mostra a página
 * só em modo DEV (pra conferir); `true` libera em produção (ver wallpapersVisible, features/wallpapers.js). Os textos são traduzidos por igualdade (data/i18n/en.js); nada daqui é HTML.
 */
const WALLPAPERS_CONFIG = {
  public: true, // LIBERADA em produção em 2026-10-18
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
  badge: "GRÁTIS PARA BAIXAR",
  title: "Fundos de tela",
  sub: "Leve o DevFest Campinas 2026 no seu celular. Escolha um fundo e baixe.",
  lockTime: "9:41",
  lockDate: "sábado, 28 de novembro",
  download: "Baixar fundo",
  photoOf: "Fundo de tela",
  soon: "Os fundos de tela do evento chegam em breve.",
  guides: [
    { title: "iPhone", text: "Abra a imagem, toque e segure, escolha Salvar na Fotos e depois Definir como fundo." },
    { title: "Android", text: "Baixe a imagem, abra na Galeria, toque no menu e escolha Definir como papel de parede." },
  ],
};

const wallpapersRepository = createRepository(WALLPAPERS, {
  getById: id => WALLPAPERS.find(item => item.id === id),
});
const wallpaperTextsRepository = createRepository(WALLPAPER_TEXTS);
const wallpapersConfigRepository = createRepository(WALLPAPERS_CONFIG);
