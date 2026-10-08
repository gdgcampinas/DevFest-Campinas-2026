/**
 * ARTES do mural (peças prontas de design usadas como cena ou como fundo). O formato do telão de LED ainda não é conhecido, então cada arte diz COMO se adapta a qualquer
 * proporção, por dado, sem CSS por arte:
 *   file    caminho (com ?v=, único lugar que sabe) | alt: descrição
 *   fit     "cover" (preenche a tela e corta o que sobrar) ou "contain" (aparece inteira, com a própria imagem desfocada no fundo). Use "contain" quando a arte tem
 *           TEXTO dentro (cortar perde palavras). Pode ser um objeto por forma de tela: { default: "cover", tall: "contain" }
 *   focus   ponto da imagem que NÃO pode ser cortado (no banner do pôr do sol, o logo vem na própria arte, à esquerda, e não cabe junto da fênix fora do 3:1: nas outras formas o foco vai
 *           pra direita, mostra a fênix e esconde o logo por inteiro, em vez de deixá-lo cortado pela metade), por forma de tela ("ultrawide", "wide", "standard", "tall"; `default` vale pras que faltarem): "x% y%"
 * As formas vêm de features/mural-stage.js (data-shape do palco). Arquivos em assets/img/mural-art-*.webp.
 */
const MURAL_ARTS_VERSION = 1;
const muralArtFile = name => `assets/img/mural-art-${name}.webp?v=${MURAL_ARTS_VERSION}`;

const MURAL_ARTS = {
  sunset: { file: muralArtFile("sunset"), alt: "Fênix sobre Campinas ao pôr do sol", fit: "cover", focus: { default: "100% 50%", ultrawide: "50% 50%", wide: "100% 50%", standard: "100% 50%", tall: "88% 40%" } },
  invite: { file: muralArtFile("invite"), alt: "DevFest Campinas 2026, 28/11: um dia inteiro de conteúdo técnico", fit: "contain", focus: { default: "50% 50%" } },
  gumbleton: { file: muralArtFile("gumbleton"), alt: "Gumbleton, a fênix do GDG Campinas, voando sobre Campinas", fit: "contain", focus: { default: "50% 40%" } },
};

const muralArtsRepository = createRepository(MURAL_ARTS, {
  get: id => MURAL_ARTS[id] ?? null,
});
