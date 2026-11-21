/**
 * A HISTÓRIA da comunidade (só dado, sem DOM): a seção "Nossa história" da página principal (features/history.js) e a cena "10 anos de DevFest" do telão

 * (components/mural-scenes/mural-history-scene.js). A chave de liberação e os tamanhos moram em data/history-config.js (carrega em toda página, pro menu). As fotos vêm do álbum "GDG CAMPINAS HISTORIA" (Google Fotos, escolhidas em 2026-11-20) e moram em assets/img/historia/.
 *   photos      cada foto: `id`, `file`, `alt` e, se houver, `credit` (o crédito de quem fotografou, mostrado na legenda)
 *   milestones  os marcos da linha do tempo, em ordem: `year` (o rótulo do cartão), `title`, `text` e `photo` (id de `photos`). Os números do selo de aniversário entram por
 *               {community} e {devfest} (anos de GDG Campinas e de DevFest, de data/anniversary.js), então o texto acompanha a próxima edição sozinho
 *   mosaic      ids de `photos` da galeria "A comunidade em ação" (home e telão); `HISTORY_CONFIG.galleryVisible` = quantas aparecem na página antes do "Ver todas as fotos"; `HISTORY_CONFIG.scenePerPage` = fotos por passada no telão
 */
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
  { id: "meetup-sala", file: "assets/img/historia/meetup-sala.webp", alt: "Plateia atenta e palestrante em pé num meetup do GDG Campinas" },
  { id: "devfest-2018-estande-grupo", file: "assets/img/historia/devfest-2018-estande-grupo.webp", alt: "Voluntários e participantes posando no estande do GDG Campinas que divulgava o DevFest de 24 de novembro de 2018" },
  { id: "devfest-2018-estande-painel", file: "assets/img/historia/devfest-2018-estande-painel.webp", alt: "Voluntário diante do painel do GDG Campinas com a data do DevFest de 24 de novembro de 2018" },
  { id: "devfest-2018-estande-wtm", file: "assets/img/historia/devfest-2018-estande-wtm.webp", alt: "Quatro pessoas apontando para o logo do Women Techmakers no painel do estande do GDG Campinas" },
  { id: "devfest-2017-trilha-mobile", file: "assets/img/historia/devfest-2017-trilha-mobile.webp", alt: "Palestra da trilha Mobile no GDG DevFest Campinas, com a sala cheia" },
  { id: "devfest-plateia-sala-azul", file: "assets/img/historia/devfest-plateia-sala-azul.webp", alt: "Plateia assistindo a uma palestra do GDG DevFest Campinas numa sala com luz azul" },
  { id: "devfest-palestrante-1", file: "assets/img/historia/devfest-palestrante-1.webp", alt: "Palestrante com microfone diante do telão no GDG DevFest Campinas" },
  { id: "devfest-palestrante-2", file: "assets/img/historia/devfest-palestrante-2.webp", alt: "Palestrante falando ao microfone no palco do GDG DevFest Campinas" },
  { id: "devfest-palestrante-3", file: "assets/img/historia/devfest-palestrante-3.webp", alt: "Palestrante explicando um tema com o microfone na mão" },
  { id: "devfest-palestrante-4", file: "assets/img/historia/devfest-palestrante-4.webp", alt: "Palestrante gesticulando durante a apresentação no DevFest" },
  { id: "devfest-2017-trilha-backend", file: "assets/img/historia/devfest-2017-trilha-backend.webp", alt: "Palestrante da trilha Back End no palco do GDG DevFest Campinas, com o painel #MakeConnections" },
  { id: "devfest-2017-cafe", file: "assets/img/historia/devfest-2017-cafe.webp", alt: "Vista de cima do saguão cheio de gente na hora do café do GDG DevFest Campinas" },
  { id: "devfest-2017-grupo-painel", file: "assets/img/historia/devfest-2017-grupo-painel.webp", alt: "Cinco pessoas da organização posando diante do painel de patrocinadores do GDG DevFest Campinas 2017" },
  { id: "devfest-2017-grupo-oito", file: "assets/img/historia/devfest-2017-grupo-oito.webp", alt: "Oito participantes posando diante do painel Google Developers do GDG DevFest Campinas" },
  { id: "devfest-2017-crachas", file: "assets/img/historia/devfest-2017-crachas.webp", alt: "Mão escrevendo o nome num crachá do GDG DevFest Campinas 2017" },
  { id: "devfest-2017-palestra-plateia", file: "assets/img/historia/devfest-2017-palestra-plateia.webp", alt: "Palestrante de pé diante da plateia atenta numa sala do GDG DevFest Campinas" },
  { id: "devfest-2017-plateia-lotada", file: "assets/img/historia/devfest-2017-plateia-lotada.webp", alt: "Auditório lotado assistindo a uma palestrante no GDG DevFest Campinas" },
  { id: "devfest-2017-palestra-patrocinadores", file: "assets/img/historia/devfest-2017-palestra-patrocinadores.webp", alt: "Palestra diante do painel de patrocinadores e do logo GDG DevFest Campinas" },
  { id: "devfest-palestrante-banner", file: "assets/img/historia/devfest-palestrante-banner.webp", alt: "Palestrante diante do banner do GDG Campinas" },
  { id: "datafest-2017-auditorio", file: "assets/img/historia/datafest-2017-auditorio.webp", alt: "Auditório cheio no DataFest 2017, evento da comunidade GDG Campinas" },
  { id: "comunidade-bosch-palestra", file: "assets/img/historia/comunidade-bosch-palestra.webp", alt: "Palestrante diante do banner do GDG Campinas e da plateia num encontro na Bosch, em 2026" },
  { id: "comunidade-2026", file: "assets/img/historia/comunidade-2026.webp", alt: "Centenas de pessoas posando juntas num encontro do GDG Campinas na Bosch, em agosto de 2026" },
];

const HISTORY_MILESTONES = [
  { id: "fundacao", year: "2009", title: "Nasce o GTUG Campinas", text: "Em julho de 2009 o grupo e o domínio são registrados, e o Google confirma a criação do GTUG, o Google Technology User Group de Campinas, que depois virou GDG.", badge: "GTUG" },
  { id: "logo", year: "2013", title: "O logo do GDG Campinas", text: "A comunidade publica o logo do GDG Campinas em 13 de janeiro de 2013.", photo: "gdg-2013-logo" },
  { id: "encontros", year: "2014", title: "Os primeiros encontros", text: "Pequenos encontros reúnem quem desenvolve em Campinas para aprender junto.", photo: "encontro-2014" },
  { id: "primeiro-devfest", year: "2016", title: "O primeiro DevFest", text: "O DevFest chega a Campinas e junta a comunidade num dia inteiro de tecnologia.", photo: "devfest-2016-palco" },
  { id: "devfest-2017", year: "2017", title: "#MakeConnections", text: "Trilhas, patrocinadores e salas cheias: o DevFest vira o encontro do ano.", photo: "devfest-2017-plateia-lotada" },
  { id: "devfest-2018", year: "2018", title: "Rumo a 24 de novembro", text: "O GDG Campinas leva o DevFest ao Hotel Vitória Concept e divulga a data em outros eventos.", photo: "devfest-2018-estande-grupo" },
  { id: "hoje", year: "2026", title: "{devfest} anos de DevFest", text: "{community} anos de GDG Campinas e uma edição para comemorar juntos.", photo: "comunidade-2026" },
];

/** Todas as fotos da galeria, em ordem: as primeiras `HISTORY_CONFIG.galleryVisible` aparecem na home, o resto abre em "Ver todas as fotos". O telão passa por todas, uma página de 8 a cada vez. */
const HISTORY_MOSAIC = [
  "devfest-2017-plateia-lotada", "devfest-2017-cafe", "devfest-2017-grupo-painel", "devfest-2018-estande-grupo",
  "devfest-plateia-sala-azul", "datafest-2017-auditorio", "devfest-2017-palestra-patrocinadores", "devfest-2017-trilha-mobile",
  "devfest-2017-grupo-oito", "devfest-patrocinadores", "devfest-2017-trilha-backend", "comunidade-grupo-1", "devfest-2016-plateia",
  "devfest-2018-estande-painel", "devfest-2018-estande-wtm", "devfest-2017-crachas", "devfest-2017-palestra-plateia",
  "meetup-sala", "devfest-palestrante-banner", "devfest-palestrante-1", "devfest-palestrante-2", "devfest-palestrante-3", "devfest-palestrante-4",
  "comunidade-grupo-2", "devfest-trilha-mentoring", "devfest-cracha", "comunidade-bosch-palestra",
];

const HISTORY_TEXTS = {
  linkTitle: "Nossa história: {community} anos de comunidade",
  linkCta: "Conheça a nossa história →",
  soon: "A nossa história chega em breve.",
  kicker: "Desde 2009",
  title: "Nossa história: {community} anos de comunidade",
  sub: "Do GTUG de 2009 ao DevFest de hoje.",
  mosaicTitle: "A comunidade em ação",
  showAll: "Ver todas as {n} fotos",
  showLess: "Ver menos fotos",
  photoBy: "Foto: {name}",
  sceneTitle: "{devfest} anos de DevFest em Campinas",
  sceneThanks: "Obrigado por fazer parte dessa história desde {founded}.",
};

const historyPhotosRepository = createRepository(HISTORY_PHOTOS, { getById: id => HISTORY_PHOTOS.find(photo => photo.id === id) });
const historyMilestonesRepository = createRepository(HISTORY_MILESTONES);
const historyMosaicRepository = createRepository(HISTORY_MOSAIC);
const historyTextsRepository = createRepository(HISTORY_TEXTS);
