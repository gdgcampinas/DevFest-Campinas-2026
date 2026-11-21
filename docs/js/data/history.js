/**
 * A HISTÓRIA da comunidade (só dado, sem DOM): a seção "Nossa história" da página principal (features/history.js) e a cena "10 anos de DevFest" do telão

 * (components/mural-scenes/mural-history-scene.js). A chave de liberação e os tamanhos moram em data/history-config.js (carrega em toda página, pro menu). As fotos vêm do álbum "GDG CAMPINAS HISTORIA" (Google Fotos, escolhidas em 2026-11-20) e moram em assets/img/historia/.
 *   photos      cada foto: `id`, `file`, `alt` e, se houver, `credit` (o crédito de quem fotografou, mostrado na legenda)
 *   milestones  os marcos da linha do tempo, em ordem: `year` (o rótulo do cartão), `title`, `text` e `photo` (id de `photos`). Os números do selo de aniversário entram por
 *               {community} e {devfest} (anos de GDG Campinas e de DevFest, de data/anniversary.js), então o texto acompanha a próxima edição sozinho
 *   archive     foto/marco com `archive: true` só aparece no modo DEV até `HISTORY_CONFIG.archivePublic` (historyReleased); `event`, `year` e `kind` (devfest | outros) alimentam a legenda e o filtro
 *   mosaic      ids de `photos` da galeria "A comunidade em ação" (home e telão); `HISTORY_CONFIG.galleryVisible` = quantas aparecem na página antes do "Ver todas as fotos"; `HISTORY_CONFIG.scenePerPage` = fotos por passada no telão
 */
const HISTORY_PHOTOS = [
  { id: "gdg-2013-logo", file: "assets/img/historia/gdg-2013-logo.webp", alt: "O logo do GDG Campinas, publicado em 13 de janeiro de 2013" },
  { id: "encontro-2014", file: "assets/img/historia/encontro-2014.webp", alt: "Grupo de pessoas da comunidade reunido numa sala, num encontro do GDG Campinas em 2014" },
  { id: "devfest-2016-palco", file: "assets/img/historia/devfest-2016-palco.webp", alt: "Palestrante no palco do GDG DevFest Campinas 2016", credit: "eLelis Fotografia", event: "DevFest", year: 2016, kind: "devfest" },
  { id: "devfest-2016-plateia", file: "assets/img/historia/devfest-2016-plateia.webp", alt: "Auditório cheio no GDG DevFest Campinas 2016", credit: "eLelis Fotografia", event: "DevFest", year: 2016, kind: "devfest" },
  { id: "comunidade-grupo-1", file: "assets/img/historia/comunidade-grupo-1.webp", alt: "Foto em grupo da comunidade GDG Campinas" },
  { id: "comunidade-grupo-2", file: "assets/img/historia/comunidade-grupo-2.webp", alt: "Outra foto em grupo da comunidade GDG Campinas" },
  { id: "devfest-patrocinadores", file: "assets/img/historia/devfest-patrocinadores.webp", alt: "Participantes diante do painel de patrocinadores do GDG DevFest Campinas", event: "DevFest", kind: "devfest" },
  { id: "devfest-trilha-mentoring", file: "assets/img/historia/devfest-trilha-mentoring.webp", alt: "Palestra da trilha Mentoring e Growth no GDG DevFest Campinas", event: "DevFest", kind: "devfest" },
  { id: "devfest-cracha", file: "assets/img/historia/devfest-cracha.webp", alt: "Participantes com crachá no GDG DevFest Campinas", event: "DevFest", kind: "devfest" },
  { id: "meetup-sala", file: "assets/img/historia/meetup-sala.webp", alt: "Plateia atenta e palestrante em pé num meetup do GDG Campinas", kind: "outros" },
  { id: "devfest-2018-estande-grupo", file: "assets/img/historia/devfest-2018-estande-grupo.webp", alt: "Voluntários e participantes posando no estande do GDG Campinas que divulgava o DevFest de 24 de novembro de 2018", event: "DevFest", year: 2018, kind: "devfest" },
  { id: "devfest-2018-estande-painel", file: "assets/img/historia/devfest-2018-estande-painel.webp", alt: "Voluntário diante do painel do GDG Campinas com a data do DevFest de 24 de novembro de 2018", event: "DevFest", year: 2018, kind: "devfest" },
  { id: "devfest-2018-estande-wtm", file: "assets/img/historia/devfest-2018-estande-wtm.webp", alt: "Quatro pessoas apontando para o logo do Women Techmakers no painel do estande do GDG Campinas", event: "DevFest", year: 2018, kind: "devfest" },
  { id: "devfest-2017-trilha-mobile", file: "assets/img/historia/devfest-2017-trilha-mobile.webp", alt: "Palestra da trilha Mobile no GDG DevFest Campinas, com a sala cheia", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-plateia-sala-azul", file: "assets/img/historia/devfest-plateia-sala-azul.webp", alt: "Plateia assistindo a uma palestra do GDG DevFest Campinas numa sala com luz azul", event: "DevFest", kind: "devfest" },
  { id: "devfest-palestrante-1", file: "assets/img/historia/devfest-palestrante-1.webp", alt: "Palestrante com microfone diante do telão no GDG DevFest Campinas", event: "DevFest", kind: "devfest" },
  { id: "devfest-palestrante-2", file: "assets/img/historia/devfest-palestrante-2.webp", alt: "Palestrante falando ao microfone no palco do GDG DevFest Campinas", event: "DevFest", kind: "devfest" },
  { id: "devfest-palestrante-3", file: "assets/img/historia/devfest-palestrante-3.webp", alt: "Palestrante explicando um tema com o microfone na mão", event: "DevFest", kind: "devfest" },
  { id: "devfest-palestrante-4", file: "assets/img/historia/devfest-palestrante-4.webp", alt: "Palestrante gesticulando durante a apresentação no DevFest", event: "DevFest", kind: "devfest" },
  { id: "devfest-2017-trilha-backend", file: "assets/img/historia/devfest-2017-trilha-backend.webp", alt: "Palestrante da trilha Back End no palco do GDG DevFest Campinas, com o painel #MakeConnections", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-2017-cafe", file: "assets/img/historia/devfest-2017-cafe.webp", alt: "Vista de cima do saguão cheio de gente na hora do café do GDG DevFest Campinas", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-2017-grupo-painel", file: "assets/img/historia/devfest-2017-grupo-painel.webp", alt: "Cinco pessoas da organização posando diante do painel de patrocinadores do GDG DevFest Campinas 2017", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-2017-grupo-oito", file: "assets/img/historia/devfest-2017-grupo-oito.webp", alt: "Oito participantes posando diante do painel Google Developers do GDG DevFest Campinas", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-2017-crachas", file: "assets/img/historia/devfest-2017-crachas.webp", alt: "Mão escrevendo o nome num crachá do GDG DevFest Campinas 2017", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-2017-palestra-plateia", file: "assets/img/historia/devfest-2017-palestra-plateia.webp", alt: "Palestrante de pé diante da plateia atenta numa sala do GDG DevFest Campinas", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-2017-plateia-lotada", file: "assets/img/historia/devfest-2017-plateia-lotada.webp", alt: "Auditório lotado assistindo a uma palestrante no GDG DevFest Campinas", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-2017-palestra-patrocinadores", file: "assets/img/historia/devfest-2017-palestra-patrocinadores.webp", alt: "Palestra diante do painel de patrocinadores e do logo GDG DevFest Campinas", event: "DevFest", year: 2017, kind: "devfest" },
  { id: "devfest-palestrante-banner", file: "assets/img/historia/devfest-palestrante-banner.webp", alt: "Palestrante diante do banner do GDG Campinas", event: "DevFest", kind: "devfest" },
  { id: "datafest-2017-auditorio", file: "assets/img/historia/datafest-2017-auditorio.webp", alt: "Auditório cheio no DataFest 2017, evento da comunidade GDG Campinas", event: "DataFest", year: 2017, kind: "outros" },
  { id: "comunidade-bosch-palestra", file: "assets/img/historia/comunidade-bosch-palestra.webp", alt: "Palestrante diante do banner do GDG Campinas e da plateia num encontro na Bosch, em 2026" },
  { id: "comunidade-2026", file: "assets/img/historia/comunidade-2026.webp", alt: "Centenas de pessoas posando juntas num encontro do GDG Campinas na Bosch, em agosto de 2026" },
  // Acervo (álbuns da comunidade 2016 a 2019, escolhidos em 2026-11-21): `archive: true` = só no modo DEV até `HISTORY_CONFIG.archivePublic`
  { id: "devfest-2016-auditorio-cheio", file: "assets/img/historia/devfest-2016-auditorio-cheio.webp", alt: "Auditório cheio de gente no GDG DevFest Campinas 2016", event: "DevFest", year: 2016, kind: "devfest", archive: true },
  { id: "devfest-2016-organizadores-palco", file: "assets/img/historia/devfest-2016-organizadores-palco.webp", alt: "Organizadores de camiseta preta no palco do GDG DevFest Campinas 2016", event: "DevFest", year: 2016, kind: "devfest", archive: true },
  { id: "devfest-2016-palestrante-adesivos", file: "assets/img/historia/devfest-2016-palestrante-adesivos.webp", alt: "Palestrante com o notebook cheio de adesivos diante do painel do GDG DevFest Campinas 2016", event: "DevFest", year: 2016, kind: "devfest", archive: true },
  { id: "devfest-2016-cafe", file: "assets/img/historia/devfest-2016-cafe.webp", alt: "Participantes na mesa do café do GDG DevFest Campinas 2016", event: "DevFest", year: 2016, kind: "devfest", archive: true },
  { id: "ux-day-2017-sala-cheia", file: "assets/img/historia/ux-day-2017-sala-cheia.webp", alt: "Sala cheia assistindo a uma palestra do UX Day Campinas, em junho de 2017", event: "UX Day", year: 2017, kind: "outros", archive: true },
  { id: "ux-day-2017-painel", file: "assets/img/historia/ux-day-2017-painel.webp", alt: "Painel de conversa com três pessoas sentadas no palco do UX Day Campinas 2017", event: "UX Day", year: 2017, kind: "outros", archive: true },
  { id: "ux-day-2017-almoco", file: "assets/img/historia/ux-day-2017-almoco.webp", alt: "Participantes almoçando juntos numa mesa comprida no UX Day Campinas 2017", event: "UX Day", year: 2017, kind: "outros", archive: true },
  { id: "ux-day-2017-dinamica", file: "assets/img/historia/ux-day-2017-dinamica.webp", alt: "Grupo conversando diante de uma parede de post-its numa dinâmica do UX Day Campinas 2017", event: "UX Day", year: 2017, kind: "outros", archive: true },
  { id: "quality-fest-2017-grupo", file: "assets/img/historia/quality-fest-2017-grupo.webp", alt: "Grande foto em grupo dos participantes do Quality Fest, em setembro de 2017", event: "Quality Fest", year: 2017, kind: "outros", archive: true },
  { id: "quality-fest-2017-pufes", file: "assets/img/historia/quality-fest-2017-pufes.webp", alt: "Plateia espalhada em pufes coloridos assistindo ao Quality Fest 2017", event: "Quality Fest", year: 2017, kind: "outros", archive: true },
  { id: "quality-fest-2017-banner", file: "assets/img/historia/quality-fest-2017-banner.webp", alt: "Quatro pessoas da organização posando diante do banner do Quality Fest 2017", event: "Quality Fest", year: 2017, kind: "outros", archive: true },
  { id: "quality-fest-2017-palestra", file: "assets/img/historia/quality-fest-2017-palestra.webp", alt: "Palestrante falando diante da plateia no Quality Fest 2017", event: "Quality Fest", year: 2017, kind: "outros", archive: true },
  { id: "quality-fest-2018-grupo-palco", file: "assets/img/historia/quality-fest-2018-grupo-palco.webp", alt: "Participantes posando para uma foto em grupo no palco do Quality Fest 2018", event: "Quality Fest", year: 2018, kind: "outros", archive: true },
  { id: "quality-fest-2018-bate-papo", file: "assets/img/historia/quality-fest-2018-bate-papo.webp", alt: "Cinco pessoas comemorando de braços para o alto no palco do Quality Fest 2018", event: "Quality Fest", year: 2018, kind: "outros", archive: true },
  { id: "quality-fest-2018-aplausos", file: "assets/img/historia/quality-fest-2018-aplausos.webp", alt: "Plateia aplaudindo no auditório do Quality Fest 2018", event: "Quality Fest", year: 2018, kind: "outros", archive: true },
  { id: "quality-fest-2018-palco", file: "assets/img/historia/quality-fest-2018-palco.webp", alt: "Palco do Quality Fest 2018 com os painéis do GDG Campinas e a plateia", event: "Quality Fest", year: 2018, kind: "outros", archive: true },
  { id: "androidfest-2018-palco", file: "assets/img/historia/androidfest-2018-palco.webp", alt: "Palestrante no palco do AndroidFest 2018, com o salão cheio", event: "AndroidFest", year: 2018, kind: "outros", archive: true },
  { id: "androidfest-2018-plateia", file: "assets/img/historia/androidfest-2018-plateia.webp", alt: "Plateia no salão iluminado de verde do AndroidFest 2018", event: "AndroidFest", year: 2018, kind: "outros", archive: true },
  { id: "androidfest-2018-solid", file: "assets/img/historia/androidfest-2018-solid.webp", alt: "Palestrante apontando para o slide dos princípios SOLID no AndroidFest 2018", event: "AndroidFest", year: 2018, kind: "outros", archive: true },
  { id: "androidfest-2018-estande", file: "assets/img/historia/androidfest-2018-estande.webp", alt: "Participantes conversando no estande de um patrocinador no AndroidFest 2018", event: "AndroidFest", year: 2018, kind: "outros", archive: true },
  { id: "datafest-2018-plateia", file: "assets/img/historia/datafest-2018-plateia.webp", alt: "Plateia sorrindo e atenta a uma palestra do DataFest 2018", event: "DataFest", year: 2018, kind: "outros", archive: true },
  { id: "datafest-2018-auditorio", file: "assets/img/historia/datafest-2018-auditorio.webp", alt: "Auditório do DataFest 2018 visto do fundo, com luzes coloridas", event: "DataFest", year: 2018, kind: "outros", archive: true },
  { id: "datafest-2018-palestra", file: "assets/img/historia/datafest-2018-palestra.webp", alt: "Palestrante em pé diante do auditório lotado no DataFest 2018", event: "DataFest", year: 2018, kind: "outros", archive: true },
  { id: "datafest-2018-cafe", file: "assets/img/historia/datafest-2018-cafe.webp", alt: "Participantes se servindo no café do DataFest 2018", event: "DataFest", year: 2018, kind: "outros", archive: true },
  { id: "devfest-2018-grupo-painel", file: "assets/img/historia/devfest-2018-grupo-painel.webp", alt: "Organizadores posando diante do painel DevFest 2018 no dia 24 de novembro", event: "DevFest", year: 2018, kind: "devfest", archive: true },
  { id: "devfest-2018-multidao", file: "assets/img/historia/devfest-2018-multidao.webp", alt: "Multidão reunida no saguão do DevFest 2018", event: "DevFest", year: 2018, kind: "devfest", archive: true },
  { id: "devfest-2018-salao", file: "assets/img/historia/devfest-2018-salao.webp", alt: "Vista de cima do salão do DevFest 2018 cheio de gente", event: "DevFest", year: 2018, kind: "devfest", archive: true },
  { id: "devfest-2018-painel-carreira", file: "assets/img/historia/devfest-2018-painel-carreira.webp", alt: "Painel de conversa sobre carreira no palco do DevFest 2018", event: "DevFest", year: 2018, kind: "devfest", archive: true },
  { id: "datafest-2019-grupo", file: "assets/img/historia/datafest-2019-grupo.webp", alt: "Plateia e organização de braços erguidos numa foto em grupo no DataFest 2019", event: "DataFest", year: 2019, kind: "outros", archive: true },
  { id: "datafest-2019-auditorio", file: "assets/img/historia/datafest-2019-auditorio.webp", alt: "Auditório lotado no DataFest 2019", event: "DataFest", year: 2019, kind: "outros", archive: true },
  { id: "datafest-2019-painel", file: "assets/img/historia/datafest-2019-painel.webp", alt: "Painel Driven by Data do DataFest 2019", event: "DataFest", year: 2019, kind: "outros", archive: true },
  { id: "datafest-2019-voluntarios", file: "assets/img/historia/datafest-2019-voluntarios.webp", alt: "Voluntários de camiseta preta junto à mesa de credenciamento do DataFest 2019", event: "DataFest", year: 2019, kind: "outros", archive: true },
];

const HISTORY_MILESTONES = [
  { id: "fundacao", year: "2009", title: "Nasce o GTUG Campinas", text: "Em julho de 2009 o grupo e o domínio são registrados, e o Google confirma a criação do GTUG, o Google Technology User Group de Campinas, que depois virou GDG.", badge: "GTUG" },
  { id: "logo", year: "2013", title: "O logo do GDG Campinas", text: "A comunidade publica o logo do GDG Campinas em 13 de janeiro de 2013.", photo: "gdg-2013-logo" },
  { id: "encontros", year: "2014", title: "Os primeiros encontros", text: "Pequenos encontros reúnem quem desenvolve em Campinas para aprender junto.", photo: "encontro-2014" },
  { id: "primeiro-devfest", year: "2016", title: "O primeiro DevFest", text: "O DevFest chega a Campinas e junta a comunidade num dia inteiro de tecnologia.", photo: "devfest-2016-palco" },
  { id: "devfest-2017", year: "2017", title: "#MakeConnections", text: "Trilhas, patrocinadores e salas cheias: o DevFest vira o encontro do ano.", photo: "devfest-2017-plateia-lotada" },
  { id: "eventos-2017", year: "2017", title: "UX Day e Quality Fest", text: "Além do DevFest, a comunidade realiza o UX Day, em junho, e o Quality Fest, em setembro.", photo: "ux-day-2017-sala-cheia", archive: true },
  { id: "devfest-2018", year: "2018", title: "Rumo a 24 de novembro", text: "O GDG Campinas leva o DevFest ao Hotel Vitória Concept e divulga a data em outros eventos.", photo: "devfest-2018-estande-grupo" },
  { id: "eventos-2018", year: "2018", title: "Um ano de eventos", text: "Quality Fest em setembro, AndroidFest e DataFest em outubro e o DevFest em novembro: a comunidade enche o calendário.", photo: "androidfest-2018-palco", archive: true },
  { id: "datafest-2019", year: "2019", title: "DataFest 2019", text: "O DataFest, em dezembro de 2019, lota o auditório e mantém a comunidade reunida.", photo: "datafest-2019-auditorio", archive: true },
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
  // acervo: intercalado por evento (DEV até liberar)
  "devfest-2016-auditorio-cheio", "devfest-2016-organizadores-palco", "devfest-2016-palestrante-adesivos", "devfest-2016-cafe", "ux-day-2017-sala-cheia", "ux-day-2017-painel", "ux-day-2017-almoco", "ux-day-2017-dinamica", "quality-fest-2017-grupo", "quality-fest-2017-pufes", "quality-fest-2017-banner", "quality-fest-2017-palestra", "quality-fest-2018-grupo-palco", "quality-fest-2018-bate-papo", "quality-fest-2018-aplausos", "quality-fest-2018-palco", "androidfest-2018-palco", "androidfest-2018-plateia", "androidfest-2018-solid", "androidfest-2018-estande", "datafest-2018-plateia", "datafest-2018-auditorio", "datafest-2018-palestra", "datafest-2018-cafe", "devfest-2018-grupo-painel", "devfest-2018-multidao", "devfest-2018-salao", "devfest-2018-painel-carreira", "datafest-2019-grupo", "datafest-2019-auditorio", "datafest-2019-painel", "datafest-2019-voluntarios",
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
  filterLabel: "Filtrar as fotos",
  filterAll: "Todas",
  filterKinds: { devfest: "DevFest", outros: "Outros eventos" },
  sceneThanks: "Obrigado por fazer parte dessa história desde {founded}.",
};

/** Foto ou marco do acervo (`archive: true`) só entra quando o acervo está liberado (`showArchive`); o resto é sempre público. Usado pela página, pela home e pelo telão. */
const historyReleased = (item, showArchive) => !item.archive || showArchive;

const historyPhotosRepository = createRepository(HISTORY_PHOTOS, { getById: id => HISTORY_PHOTOS.find(photo => photo.id === id) });
const historyMilestonesRepository = createRepository(HISTORY_MILESTONES);
const historyMosaicRepository = createRepository(HISTORY_MOSAIC);
const historyTextsRepository = createRepository(HISTORY_TEXTS);
