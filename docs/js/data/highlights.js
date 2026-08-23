/**
 * Fotos de "como foi a última edição" — DevFest Campinas 2025. Mesma
 * quantidade de fotos da referência (2018): 16. Imagens já comprimidas
 * (sips -Z 900 -s formatOptions 60) em assets/img/highlights/.
 *
 * HIGHLIGHTS_VERSION funciona como o ?v= dos scripts: trocar o
 * conteúdo de uma foto sem renomear o arquivo não invalida cache de
 * CDN/navegador (GitHub Pages cacheia por URL) — bump aqui sempre que
 * as fotos mudarem de conteúdo mantendo o mesmo nome de arquivo.
 */
const HIGHLIGHTS_VERSION = 2;

const HIGHLIGHTS = {
  title: "Veja como foi o DevFest 2025",
  photos: Array.from({ length: 16 }, (_, i) => ({
    file: `assets/img/highlights/devfest-2025-${String(i + 1).padStart(2, "0")}.jpg?v=${HIGHLIGHTS_VERSION}`,
    alt: `Foto ${i + 1} do DevFest Campinas 2025`,
  })),
};
