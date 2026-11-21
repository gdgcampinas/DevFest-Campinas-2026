/**
 * Feature: o selo redondo de aniversário no canto do telão (components/anniversary-seal.js). Tudo por parâmetro:
 *   sealVisibleFor(config, scene)   regra pura: só com `config.telaoSeal.public`, e nunca em cena de tipo `hideOnTypes` (vídeo) nem de id `hideOnIds` (emergência)
 *   initAnniversarySeal(el, options) desenha o selo uma vez (`config`, `text`, `eventYear`) e devolve `show(scene)`: a cada troca de cena mostra ou esconde (e marca `data-seal` no palco, pra os cabeçalhos das cenas deixarem o canto livre), e quando aparece ele ENTRA com a animação
 *                                    (gira e cresce); o brilho e o pulso do brilho rodam sozinhos no CSS. Ano zero ou negativo (evento antes do marco) não mostra nada.
 * Dual: as regras puras rodam no Node (testes).
 */
function sealVisibleFor(config, scene) {
  const seal = config.telaoSeal;
  if (!seal?.public || !scene) return false;
  return !seal.hideOnTypes.includes(scene.type) && !seal.hideOnIds.includes(scene.id);
}

function initAnniversarySeal(sealEl, { config, text, eventYear }) {
  const years = anniversaryYears({ eventYear, ...config });
  const drawable = config.telaoSeal?.public && years.devfest > 0;
  sealEl.innerHTML = drawable ? anniversarySealMarkup({ years, firstDevFest: config.firstDevFest, eventYear, text: text.seal }) : "";
  let shown = false;
  return {
    show(scene) {
      const visible = Boolean(drawable) && sealVisibleFor(config, scene);
      if (visible && !shown) { // entra de novo a cada volta (depois de um vídeo, por exemplo)
        sealEl.classList.remove("is-in");
        void sealEl.offsetWidth; // reinicia a animação de entrada
        sealEl.classList.add("is-in");
      }
      sealEl.hidden = !visible;
      sealEl.parentElement?.toggleAttribute("data-seal", visible); // o palco avisa as cenas: os cabeçalhos deixam o canto livre (CSS)
      shown = visible;
      return visible;
    },
  };
}

if (typeof module !== "undefined") module.exports = { sealVisibleFor };
