/**
 * As FOTOS do campus (PUC-Campinas, Campus I) da página "Como chegar" e da cena "Onde estamos" do telão, só dado. `public: false` mostra a galeria só no modo DEV (pra conferir); `true` libera em produção (ver features/release-gate.js).
 * Cada foto: `id` único | `name`, o arquivo em assets/img/campus/ (vira `file`, e `thumb` na pasta thumbs/ para as que não são `featured`) | `caption` (a legenda, também o texto alternativo da imagem) | `featured: true` na foto do prédio do evento (vai primeiro, grande, e é a da cena do telão).
 * Só a foto `featured` é do H-02: nas outras a legenda diz só o que se vê (o prédio H-13 e o H-15 têm a placa na foto). Os textos são traduzidos por igualdade (data/i18n/en.js). Para uma foto nova, é só uma linha em VENUE_PHOTOS.
 * As fotos são da PUC-Campinas, usadas com a autorização dela.
 */
const VENUE_PHOTOS_CONFIG = { public: false };

const VENUE_PHOTOS_DIR = "assets/img/campus";

/** Uma foto: `name` é o arquivo (sem a pasta). As que não são `featured` ganham a miniatura leve da grade em `thumbs/<name>` (a foto grande só carrega ao ampliar); a `featured` já abre grande. */
const venuePhoto = ({ id, name, caption, featured = false }) => ({
  id, file: `${VENUE_PHOTOS_DIR}/${name}`, ...(featured ? { featured } : { thumb: `${VENUE_PHOTOS_DIR}/thumbs/${name}` }), caption,
});

const VENUE_PHOTOS = [
  { id: "h02", name: "predio-h02.webp", featured: true, caption: "Prédio H-02, onde o DevFest Campinas acontece" },
  { id: "aerea-predio-azul", name: "aerea-predio-azul.webp", caption: "Vista aérea do Campus I e seus prédios" },
  { id: "aerea-ampla", name: "aerea-ampla.webp", caption: "Vista aérea do Campus I, entre os prédios e o estacionamento" },
  { id: "aerea-estacionamento", name: "aerea-estacionamento.webp", caption: "Vista aérea do Campus I e os estacionamentos" },
  { id: "aerea-blocos", name: "aerea-blocos.webp", caption: "Vista aérea dos prédios do Campus I" },
  { id: "aerea-predio-curvo", name: "aerea-predio-curvo.webp", caption: "Vista aérea de um dos prédios do Campus I" },
  { id: "skyline-campinas", name: "skyline-campinas.webp", caption: "O Campus I e Campinas ao fundo" },
  { id: "area-convivio-h15", name: "area-convivio-h15.webp", caption: "Área de convivência, prédio H-15" },
  { id: "predio-h13", name: "predio-h13.webp", caption: "Prédio H-13" },
  { id: "patio-interno", name: "patio-interno.webp", caption: "Pátio interno do campus" },
].map(venuePhoto);

/** Os textos da galeria (página "Como chegar"). `link.label` é o botão que leva ao site da PUC (o endereço vem de data/venue.js, `links` com id "about", injetado pela página). */
const VENUE_PHOTOS_TEXTS = {
  badge: "O CAMPUS",
  title: "Conheça o",
  titleAccent: "Campus I",
  sub: "O campus da PUC-Campinas onde o DevFest acontece. Toque numa foto para ampliar.",
  linkLabel: "Conheça o Campus I no site da PUC-Campinas",
  open: "Ampliar a foto",
  previous: "Foto anterior",
  next: "Próxima foto",
  counter: "Foto {current} de {total}",
};

const venuePhotosConfigRepository = createRepository(VENUE_PHOTOS_CONFIG);
const venuePhotosTextsRepository = createRepository(VENUE_PHOTOS_TEXTS);
const venuePhotosRepository = createRepository(VENUE_PHOTOS, {
  getById: id => VENUE_PHOTOS.find(photo => photo.id === id) ?? null,
  /** A foto do prédio do evento (a `featured`; a primeira da lista se nenhuma estiver marcada). */
  featured: () => VENUE_PHOTOS.find(photo => photo.featured) ?? VENUE_PHOTOS[0] ?? null,
  /** A lista com a foto em destaque primeiro, sem mexer na ordem das outras. */
  ordered: () => [...VENUE_PHOTOS.filter(photo => photo.featured), ...VENUE_PHOTOS.filter(photo => !photo.featured)],
});
