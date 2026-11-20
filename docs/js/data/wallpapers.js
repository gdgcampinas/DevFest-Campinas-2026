/**
 * Fundos de tela de celular do evento (1080x2340 de proporção, feitos pela organização), só dado: cada fundo tem o arquivo pra baixar e a miniatura (assets/img/wallpapers/). `public: false` mostra a página
 * só em modo DEV (pra conferir); `true` libera em produção (ver wallpapersVisible, features/wallpapers.js). Os textos são traduzidos por igualdade (data/i18n/en.js); nada daqui é HTML.
 */
const WALLPAPERS_CONFIG = {
  public: true, // LIBERADA em produção em 2026-10-18
};

/** Data em que os primeiros fundos saíram; quem não traz `added` conta como dessa leva. Os mais NOVOS vêm sempre primeiro (na página, na faixa da home e no telão): é só pôr `added` no fundo novo. */
const WALLPAPERS_FIRST_RELEASE = "2026-10-18";

const WALLPAPERS = [
  { id: "guarda-chuvas", title: "Rua dos guarda-chuvas" },
  { id: "lagoa-do-taquaral", title: "Lagoa do Taquaral" },
  { id: "campinas-entardecer", title: "Torre do Castelo ao entardecer" },
  { id: "por-do-sol-na-lagoa", title: "Pôr do sol na Lagoa do Taquaral" },
  { id: "predio-de-tijolos", title: "Prédio do Relógio" },
  { id: "parque-entre-as-rochas", title: "Parque entre as rochas" },
  { id: "parque-entre-as-rochas-ao-por-do-sol", title: "Parque entre as rochas ao pôr do sol" },
  { id: "torre-do-castelo-a-noite", title: "Torre do Castelo à noite" },
  { id: "fenix-no-circuito", title: "Fênix no circuito" },
  { id: "fenix-e-o-caderno", title: "Fênix e o caderno na Torre do Castelo", added: "2026-11-20" },
  { id: "fenix-na-lagoa-do-taquaral", title: "Fênix na Lagoa do Taquaral", added: "2026-11-20" },
  { id: "torre-do-castelo-em-rosa", title: "Torre do Castelo em rosa", added: "2026-11-20" },
].map(({ added = WALLPAPERS_FIRST_RELEASE, ...item }) => ({
  ...item,
  added,
  image: `assets/img/wallpapers/fundo-${item.id}.jpg`,
  thumb: `assets/img/wallpapers/fundo-${item.id}-thumb.webp`,
  filename: `devfest-campinas-2026-fundo-${item.id}.jpg`,
})).sort((a, b) => b.added.localeCompare(a.added)); // os mais novos primeiro; na mesma data vale a ordem da lista (o sort é estável)

/**
 * A faixa "Leve o DevFest no celular" da página principal (features/wallpaper-band.js). `public: false` = só no modo DEV até liberar (features/release-gate.js).
 * `phones` = quantos celulares mostra (os mais novos), `href` = pra onde o botão leva (o `origem` conta quem veio da home).
 */
const WALLPAPER_BAND_CONFIG = {
  public: true, // liberada em PROD em 2026-11-20 (pedido do Renato); false volta a escondê-la (só no modo DEV)
  phones: 3,
  href: "fundos.html?origem=home",
};

const WALLPAPER_TEXTS = {
  guidesTitle: "Como usar",
  badge: "GRÁTIS PARA BAIXAR",
  title: "Fundos de tela",
  sub: "Leve o DevFest Campinas 2026 no seu celular. Escolha um fundo e baixe.",
  lockTime: "9:41",
  lockDate: "sábado, 28 de novembro",
  download: "Baixar fundo",
  photoOf: "Fundo de tela",
  soon: "Os fundos de tela do evento chegam em breve.",
  bandTitle: "Leve o DevFest no celular",
  bandBody: "{n} fundos de tela do evento: a Fênix, a Torre do Castelo, a Lagoa.",
  bandCta: "Ver os {n} fundos →",
  guides: [
    { id: "ios", title: "iPhone", steps: ["Toque na imagem para abri-la.", "Segure o dedo sobre ela e escolha Salvar na Fotos.", "Em Fotos, toque em Compartilhar e depois em Usar como fundo de tela."] },
    { id: "android", title: "Android", steps: ["Toque em Baixar fundo.", "Abra a imagem na Galeria.", "No menu, escolha Definir como papel de parede."] },
  ],
};

const wallpapersRepository = createRepository(WALLPAPERS, {
  getById: id => WALLPAPERS.find(item => item.id === id),
});
const wallpaperTextsRepository = createRepository(WALLPAPER_TEXTS);
const wallpapersConfigRepository = createRepository(WALLPAPERS_CONFIG);
const wallpaperBandConfigRepository = createRepository(WALLPAPER_BAND_CONFIG);
