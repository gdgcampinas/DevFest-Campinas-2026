/**
 * Aniversário da comunidade (só dado, sem DOM): o selo "13 anos de GDG Campinas · 10 anos de DevFest" da página principal (features/anniversary.js).
 * Os anos saem da data do evento (data/schedule.js, EVENT.date), então o selo se atualiza sozinho na próxima edição; aqui só moram os marcos.
 *   public            false = só no modo DEV até liberar (features/release-gate.js); true libera em produção
 *   communityFounded  ano em que o GDG Campinas nasceu (13/01/2013)  |  firstDevFest  ano do primeiro DevFest em Campinas (2016)
 */
const ANNIVERSARY_CONFIG = {
  public: true, // liberado em PROD em 2026-11-20 (pedido do Renato); false volta a escondê-lo (só no modo DEV)
  communityFounded: 2013,
  firstDevFest: 2016,
};

const ANNIVERSARY_TEXTS = {
  badge: "{community} anos de GDG Campinas · {devfest} anos de DevFest",
};

const anniversaryConfigRepository = createRepository(ANNIVERSARY_CONFIG);
const anniversaryTextsRepository = createRepository(ANNIVERSARY_TEXTS);
