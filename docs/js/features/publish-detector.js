/**
 * Detector de "acabou de ser publicado": uma tela que escuta um resultado (pódio do concurso) só comemora quando ela VIU a lista vazia e
 * depois a lista encheu, ou seja, a publicação aconteceu ao vivo. Tela aberta (ou recarregada) com o resultado já publicado não comemora.
 * `observe(list)` devolve true no momento da publicação; `reset()` esquece o que viu. Usado pelo quadro da sala e pelo mural. Dual.
 */
function createFreshPublishDetector() {
  let sawEmpty = false;
  let hadItems = false;
  return {
    observe(list) {
      const hasItems = (list?.length ?? 0) > 0;
      const fresh = sawEmpty && !hadItems && hasItems;
      if (!hasItems) sawEmpty = true;
      hadItems = hasItems;
      return fresh;
    },
    reset() {
      sawEmpty = false;
      hadItems = false;
    },
  };
}

if (typeof module !== "undefined") module.exports = { createFreshPublishDetector };
