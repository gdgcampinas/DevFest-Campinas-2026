/**
 * Layout da legenda das trilhas na Grade (acima das palestras): linhas com a TRILHA e a SALA em destaque e o mestre de cerimônia menor (components/track-legend.js, css/track-legend.css). Com `public: false` só aparece no modo DEV; sem liberação vale a legenda de colunas de sempre (que no celular não aparece). `mcPrefix` = o começo do texto de `mc` (data/schedule.js) que o selo `mcLabel` já diz.
 */
const TRACK_LEGEND = {
  public: true, // liberado em PROD em 2026-11-27 (pedido do Renato); false volta a mostrar só no modo DEV
  mcLabel: "MC",
  mcPrefix: /^MC\s*-\s*/,
};

const trackLegendRepository = createRepository(TRACK_LEGEND);
