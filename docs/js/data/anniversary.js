/**
 * Aniversário da comunidade (só dado, sem DOM): o selo "17 anos de GDG Campinas · 10 anos de DevFest" da página principal (features/anniversary.js).
 * Os anos saem da data do evento (data/schedule.js, EVENT.date), então o selo se atualiza sozinho na próxima edição; aqui só moram os marcos.
 *   public            false = só no modo DEV até liberar (features/release-gate.js); true libera em produção
 *   telaoSeal         o selo redondo do telão: `public`, `hideOnTypes` (tipos de cena sem selo) e `hideOnIds` (cenas sem selo)
 *   communityFounded  ano em que o GDG Campinas nasceu, ainda como GTUG (grupo registrado em 21/07/2009, por Douglas Kayama)  |  firstDevFest  ano do primeiro DevFest em Campinas (2016)
 */
const ANNIVERSARY_CONFIG = {
  public: true, // liberado em PROD em 2026-11-20 (pedido do Renato); false volta a escondê-lo (só no modo DEV)
  communityFounded: 2009,
  firstDevFest: 2016,
  // o SELO REDONDO "10 anos de DevFest" no canto de todas as cenas do telão (components/anniversary-seal.js, features/anniversary-seal.js). O telão é só produção (não tem modo DEV):
  // `public: false` = só no ensaio (`telao.html?selo=1`); true libera. Some nas cenas dos tipos de `hideOnTypes` (vídeos) e nas de `hideOnIds` (a emergência do moderador).
  telaoSeal: { public: false, hideOnTypes: ["video"], hideOnIds: ["emergencia"] },
};

const ANNIVERSARY_TEXTS = {
  badge: "{community} anos de GDG Campinas · {devfest} anos de DevFest",
  seal: { top: "DEVFEST CAMPINAS", unit: "ANOS", label: "{devfest} anos de DevFest em Campinas" },
};

const anniversaryConfigRepository = createRepository(ANNIVERSARY_CONFIG);
const anniversaryTextsRepository = createRepository(ANNIVERSARY_TEXTS);
