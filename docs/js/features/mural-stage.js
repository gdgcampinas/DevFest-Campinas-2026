/**
 * Palco do mural: o telão de LED tem proporção e resolução que ainda não conhecemos, então o palco é um quadro de tamanho conhecido
 * (CSS em unidades de contêiner, css/mural.css) e este arquivo só decide o tamanho dele. Parte pura (dual: navegador e Node, testada em
 * DevFestIA/tools/mural) e parte que mexe no DOM.
 *
 *   sem parâmetro        o palco ocupa a janela inteira (é o que o telão de verdade faz, em tela cheia)
 *   ?tela=1920x1080      SIMULA esse telão: palco com exatamente essa resolução, reduzido pra caber na janela, com moldura
 *   ?proporcao=3:1       SIMULA só a proporção: o maior palco dessa proporção que cabe na janela, com moldura
 *   ?margem=2            margem segura em % (telão de LED costuma cortar as bordas); padrão em MURAL_CONFIG.stage.safeMarginPct
 *
 * `shape` (ultrawide, wide, standard, tall) vai pro atributo data-shape do palco: o CSS troca o desenho pela forma (ex.: 4 colunas em wide,
 * uma faixa só em ultrawide) sem saber a resolução.
 */
function parseStageSpec(search, { safeMarginPct = 0 } = {}) {
  const params = new URLSearchParams(search);
  const margin = Number(params.get("margem"));
  const base = { safeMarginPct: params.has("margem") && margin >= 0 && margin < 25 ? margin : safeMarginPct };
  const size = /^(\d{3,5})x(\d{3,5})$/i.exec(params.get("tela") ?? "");
  if (size) return { ...base, mode: "size", width: Number(size[1]), height: Number(size[2]) };
  const ratio = /^(\d+(?:\.\d+)?)[:x](\d+(?:\.\d+)?)$/i.exec(params.get("proporcao") ?? "");
  if (ratio && Number(ratio[1]) > 0 && Number(ratio[2]) > 0) return { ...base, mode: "ratio", ratio: Number(ratio[1]) / Number(ratio[2]) };
  return { ...base, mode: "fill" };
}

function shapeOf(ratio, shapes) {
  return shapes.find(shape => ratio >= shape.minRatio)?.id ?? shapes[shapes.length - 1].id;
}

/** Tamanho do palco, escala e posição dentro da janela. `framed` = simulação (desenha a moldura). */
function computeStage({ viewport, spec, shapes, framePadding = 0.94 }) {
  const { width: vw, height: vh } = viewport;
  let width = vw;
  let height = vh;
  let scale = 1;
  if (spec.mode === "size") {
    width = spec.width;
    height = spec.height;
    scale = Math.min((vw * framePadding) / width, (vh * framePadding) / height);
  } else if (spec.mode === "ratio") {
    height = Math.min(vh * framePadding, (vw * framePadding) / spec.ratio);
    width = height * spec.ratio;
  }
  width = Math.round(width);
  height = Math.round(height);
  return {
    width,
    height,
    scale,
    left: Math.round((vw - width * scale) / 2),
    top: Math.round((vh - height * scale) / 2),
    ratio: width / height,
    shape: shapeOf(width / height, shapes),
    framed: spec.mode !== "fill",
  };
}

/** Aplica no DOM e acompanha o redimensionar da janela. `frameEl` = o elemento de fundo da simulação; `win` injetável. */
function mountStage({ stageEl, spec, shapes, win = window }) {
  const apply = () => {
    const box = computeStage({ viewport: { width: win.innerWidth, height: win.innerHeight }, spec, shapes });
    Object.assign(stageEl.style, {
      width: `${box.width}px`,
      height: `${box.height}px`,
      left: `${box.left}px`,
      top: `${box.top}px`,
      transform: box.scale === 1 ? "" : `scale(${box.scale})`,
    });
    stageEl.style.setProperty("--safe-margin", `${spec.safeMarginPct}%`);
    stageEl.dataset.shape = box.shape;
    stageEl.dataset.framed = String(box.framed);
    stageEl.dataset.size = `${box.width}x${box.height}`;
    return box;
  };
  win.addEventListener("resize", apply);
  return { apply, stop: () => win.removeEventListener("resize", apply) };
}

if (typeof module !== "undefined") module.exports = { parseStageSpec, computeStage, shapeOf, mountStage };
