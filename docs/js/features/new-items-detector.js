/**
 * Detector de itens NOVOS numa lista que chega várias vezes (álbum ao vivo lido a cada 45 s): a primeira leitura é a base (nada é "novo", senão o mural abriria a tela cheia
 * de "nova foto" pras fotos que já estavam lá) e, daí em diante, `observe(items)` devolve só os que não tinham aparecido, na ordem recebida. Dual (navegador e Node).
 */
function createNewItemsDetector({ keyOf = item => item.id } = {}) {
  let seen = null;
  return {
    observe(items) {
      if (seen === null) {
        seen = new Set(items.map(keyOf));
        return [];
      }
      const fresh = items.filter(item => !seen.has(keyOf(item)));
      fresh.forEach(item => seen.add(keyOf(item)));
      return fresh;
    },
    reset() {
      seen = null;
    },
  };
}

if (typeof module !== "undefined") module.exports = { createNewItemsDetector };
