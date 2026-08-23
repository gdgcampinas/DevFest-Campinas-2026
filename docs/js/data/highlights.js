/**
 * Fotos de "como foi a última edição" — DevFest Campinas 2025. Mesma
 * quantidade de fotos da referência (2018): 16. Imagens já comprimidas
 * (sips -Z 900 -s formatOptions 60) em assets/img/highlights/.
 */
const HIGHLIGHTS = {
  title: "Veja como foi o DevFest 2025",
  photos: Array.from({ length: 16 }, (_, i) => ({
    file: `assets/img/highlights/devfest-2025-${String(i + 1).padStart(2, "0")}.jpg`,
    alt: `Foto ${i + 1} do DevFest Campinas 2025`,
  })),
};
