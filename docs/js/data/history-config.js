/**
 * A CHAVE e os tamanhos da história da comunidade (só dado, sem DOM). Fica num arquivo próprio e pequeno porque o menu (components/site-nav.js) precisa dela em toda página;
 * as fotos, os marcos e os textos moram em data/history.js (só na página de história, na home e no telão).
 *   public         false = só no modo DEV até liberar (features/release-gate.js): some o link do menu, o cartão da home e a cena do telão; true libera tudo em produção
 *   archivePublic  false = o acervo novo (fotos e marcos com `archive: true` em data/history.js) só aparece no modo DEV; true libera em produção
 *   storyPublic    a história completa no telão (features/history-story.js, cena `history`): false = só ensaio; true libera em produção  |  tour  segundos de cada passo da volta completa
 *   galleryVisible quantas fotos da galeria aparecem direto na página, antes do "Ver todas as fotos"  |  scenePerPage  fotos por passada da cena do telão
 */
const HISTORY_CONFIG = {
  public: true, // liberada em PROD em 2026-11-20 (pedido do Renato); false volta a esconder tudo (só no modo DEV)
  archivePublic: true, // liberado em PROD em 2026-11-21 (pedido do Renato): as fotos dos álbuns 2016 a 2019 (marcos, galeria e telão); false volta a escondê-las (só no modo DEV)
  storyPublic: false, // a HISTÓRIA COMPLETA no telão (cartões dos marcos, mosaicos por evento com legenda, destaques em tela cheia e a volta completa nos intervalos): false = só ensaio (?cenas=historia-marco...); true libera em PROD
  tour: { marco: 9, mosaico: 9, destaque: 7 }, // segundos de cada passo da "história completa"
  galleryVisible: 12,
  scenePerPage: 8,
};

const historyConfigRepository = createRepository(HISTORY_CONFIG);
