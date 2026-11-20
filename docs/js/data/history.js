/**
 * A HISTÓRIA da comunidade (só dado, sem DOM): a seção "Nossa história" da página principal (features/history.js) e a cena "10 anos de DevFest" do telão
 * (components/mural-scenes/mural-history-scene.js). As fotos vêm do álbum "GDG CAMPINAS HISTORIA" (Google Fotos, escolhidas em 2026-11-20) e moram em assets/img/historia/.
 *   public      false = só no modo DEV até liberar (features/release-gate.js) e cena do telão desligada; true libera em produção e no telão
 *   photos      cada foto: `id`, `file`, `alt` e, se houver, `credit` (o crédito de quem fotografou, mostrado na legenda)
 *   milestones  os marcos da linha do tempo, em ordem: `year` (o rótulo do cartão), `title`, `text` e `photo` (id de `photos`). Os números do selo de aniversário entram por
 *               {community} e {devfest} (anos de GDG Campinas e de DevFest, de data/anniversary.js), então o texto acompanha a próxima edição sozinho
 *   mosaic      ids de `photos` do mosaico "A comunidade em ação" (home e telão)
 */
const HISTORY_CONFIG = {
  public: false,
};

const HISTORY_PHOTOS = [
  { id: "gdg-2013-logo", file: "assets/img/historia/gdg-2013-logo.webp", alt: "O logo do GDG Campinas, publicado em 13 de janeiro de 2013" },
  { id: "encontro-2014", file: "assets/img/historia/encontro-2014.webp", alt: "Grupo de pessoas da comunidade reunido numa sala, num encontro do GDG Campinas em 2014" },
  { id: "devfest-2016-palco", file: "assets/img/historia/devfest-2016-palco.webp", alt: "Palestrante no palco do GDG DevFest Campinas 2016", credit: "eLelis Fotografia" },
  { id: "devfest-2016-plateia", file: "assets/img/historia/devfest-2016-plateia.webp", alt: "Auditório cheio no GDG DevFest Campinas 2016", credit: "eLelis Fotografia" },
  { id: "comunidade-grupo-1", file: "assets/img/historia/comunidade-grupo-1.webp", alt: "Foto em grupo da comunidade GDG Campinas" },
  { id: "comunidade-grupo-2", file: "assets/img/historia/comunidade-grupo-2.webp", alt: "Outra foto em grupo da comunidade GDG Campinas" },
  { id: "devfest-patrocinadores", file: "assets/img/historia/devfest-patrocinadores.webp", alt: "Participantes diante do painel de patrocinadores do GDG DevFest Campinas" },
  { id: "devfest-trilha-mentoring", file: "assets/img/historia/devfest-trilha-mentoring.webp", alt: "Palestra da trilha Mentoring e Growth no GDG DevFest Campinas" },
  { id: "devfest-cracha", file: "assets/img/historia/devfest-cracha.webp", alt: "Participantes com crachá no GDG DevFest Campinas" },
  { id: "comunidade-bosch-palestra", file: "assets/img/historia/comunidade-bosch-palestra.webp", alt: "Palestrante diante do banner do GDG Campinas e da plateia num encontro na Bosch, em 2026" },
  { id: "comunidade-2026", file: "assets/img/historia/comunidade-2026.webp", alt: "Centenas de pessoas posando juntas num encontro do GDG Campinas na Bosch, em agosto de 2026" },
];

const HISTORY_MILESTONES = [
  { id: "fundacao", year: "2013", title: "Nasce o GDG Campinas", text: "A comunidade de desenvolvedores de Campinas começa a se encontrar.", photo: "gdg-2013-logo" },
  { id: "encontros", year: "2014", title: "Os primeiros encontros", text: "Pequenos encontros reúnem quem desenvolve em Campinas para aprender junto.", photo: "encontro-2014" },
  { id: "primeiro-devfest", year: "2016", title: "O primeiro DevFest", text: "O DevFest chega a Campinas e junta a comunidade num dia inteiro de tecnologia.", photo: "devfest-2016-palco" },
  { id: "crescimento", year: "Desde então", title: "Cada edição, mais gente", text: "Trilhas, parceiros e muita gente que fez o DevFest crescer.", photo: "devfest-patrocinadores" },
  { id: "hoje", year: "2026", title: "{devfest} anos de DevFest", text: "{community} anos de GDG Campinas e uma edição para comemorar juntos.", photo: "comunidade-2026" },
];

const HISTORY_MOSAIC = ["comunidade-grupo-1", "devfest-2016-plateia", "comunidade-grupo-2", "devfest-patrocinadores", "devfest-2016-palco", "devfest-trilha-mentoring", "devfest-cracha", "comunidade-bosch-palestra"];

const HISTORY_TEXTS = {
  kicker: "Desde 2013",
  title: "Nossa história: {community} anos de comunidade",
  sub: "Do primeiro encontro ao DevFest de hoje.",
  mosaicTitle: "A comunidade em ação",
  photoBy: "Foto: {name}",
  sceneTitle: "{devfest} anos de DevFest em Campinas",
  sceneThanks: "Obrigado por fazer parte dessa história desde {founded}.",
};

const historyPhotosRepository = createRepository(HISTORY_PHOTOS, { getById: id => HISTORY_PHOTOS.find(photo => photo.id === id) });
const historyConfigRepository = createRepository(HISTORY_CONFIG);
const historyMilestonesRepository = createRepository(HISTORY_MILESTONES);
const historyMosaicRepository = createRepository(HISTORY_MOSAIC);
const historyTextsRepository = createRepository(HISTORY_TEXTS);
