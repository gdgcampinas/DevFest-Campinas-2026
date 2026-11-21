/**
 * Aniversário da comunidade (só dado, sem DOM): o selo "17 anos de GDG Campinas · 10 anos de DevFest" da página principal (features/anniversary.js).
 * Os anos saem da data do evento (data/schedule.js, EVENT.date), então o selo se atualiza sozinho na próxima edição; aqui só moram os marcos.
 *   public            false = só no modo DEV até liberar (features/release-gate.js); true libera em produção
 *   siteSeal          o selo redondo ao lado da pílula nas páginas do site: `public` (false = só no modo DEV)
 *   telaoSeal         o selo redondo do telão: `public`, `hideOnTypes` (tipos de cena sem selo), `hideOnIds` (cenas sem selo) e `leftOnTypes` (tipos de cena em que ele vai pro canto esquerdo)
 *   communityFounded  ano em que o GDG Campinas nasceu, ainda como GTUG (grupo registrado em 21/07/2009, por Douglas Kayama)  |  firstDevFest  ano do primeiro DevFest em Campinas (2016)
 */
const ANNIVERSARY_CONFIG = {
  public: true, // liberado em PROD em 2026-11-20 (pedido do Renato); false volta a escondê-lo (só no modo DEV)
  communityFounded: 2009,
  firstDevFest: 2016,
  // o SELO REDONDO "10 anos de DevFest" no canto de todas as cenas do telão (components/anniversary-seal.js, features/anniversary-seal.js). O telão é só produção (não tem modo DEV):
  // `public: false` = só no ensaio (`telao.html?selo=1`); true libera. Some nas cenas dos tipos de `hideOnTypes` (vídeos) e nas de `hideOnIds` (a emergência do moderador). `leftOnTypes`: nas cenas desses tipos (as do QR code, que ocupa o lado direito; nos fundos de tela o canto direito fica livre e o título está à esquerda, então ali ele fica à direita) o selo muda pro canto ESQUERDO pra nunca cobrir o QR.
  // o MESMO selo redondo no cabeçalho do SITE (opção B do Renato, 2026-11-21): à esquerda da pílula, clicável (leva à história). `public: false` = só no modo DEV; true libera em produção.
  siteSeal: { public: false },
  telaoSeal: { public: false, hideOnTypes: ["video"], hideOnIds: ["emergencia"], leftOnTypes: ["qr"] },
};

const ANNIVERSARY_TEXTS = {
  badge: "{community} anos de GDG Campinas · {devfest} anos de DevFest",
  seal: { top: "DEVFEST CAMPINAS", unit: "ANOS", label: "{devfest} anos de DevFest em Campinas" },
};

const anniversaryConfigRepository = createRepository(ANNIVERSARY_CONFIG);
const anniversaryTextsRepository = createRepository(ANNIVERSARY_TEXTS);
