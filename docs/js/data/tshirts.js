/**
 * A camiseta oficial do kit (Ingresso + Kit Camiseta), só dado: os 3 modelos, cada um com a foto da frente e das costas (e a miniatura de cada uma), mais os textos da vitrine e da galeria. As imagens são
 * modelos ilustrativos (assets/img/camisetas/, fundo branco, camiseta preta). Os textos são traduzidos por igualdade (data/i18n/en.js). Nada daqui é HTML: a marcação escapa tudo (components/tshirt-gallery.js).
 */
const TSHIRT_MODELS = [
  { id: "masculina", label: "Masculina" },
  { id: "feminina", label: "Feminina" },
  { id: "infantil", label: "Infantil" },
].map(model => ({
  ...model,
  images: { frente: `assets/img/camisetas/${model.id}-frente.webp`, costas: `assets/img/camisetas/${model.id}-costas.webp` },
  thumbs: { frente: `assets/img/camisetas/${model.id}-frente-thumb.webp`, costas: `assets/img/camisetas/${model.id}-costas-thumb.webp` },
}));

const TSHIRT_TEXTS = {
  showcaseButton: "Ver a camiseta",
  showcaseLabel: "Ver as fotos da camiseta oficial",
  galleryTitle: "A camiseta do DevFest Campinas 2026",
  modalLabel: "Fotos da camiseta oficial",
  sides: { frente: "Frente", costas: "Costas" },
  photoOf: "Camiseta",
  note: "Fotos ilustrativas dos modelos masculino, feminino e infantil. A cor é preta.",
};

const tshirtsRepository = createRepository(TSHIRT_MODELS, {
  getById: id => TSHIRT_MODELS.find(model => model.id === id),
});
const tshirtTextsRepository = createRepository(TSHIRT_TEXTS);
