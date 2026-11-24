/**
 * ARTES do mural (peças prontas de design usadas como cena ou como fundo). O formato do telão de LED ainda não é conhecido, então cada arte diz COMO se adapta a qualquer
 * proporção, por dado, sem CSS por arte:
 *   file    caminho (com ?v=, único lugar que sabe) | alt: descrição
 *   fit     "cover" (preenche a tela e corta o que sobrar) ou "contain" (aparece inteira, com a própria imagem desfocada no fundo). Use "contain" quando a arte tem
 *           TEXTO dentro (cortar perde palavras). Pode ser um objeto por forma de tela: { default: "cover", tall: "contain" }
 *   focus   ponto da imagem que NÃO pode ser cortado (no banner do pôr do sol, o logo vem na própria arte, à esquerda, e não cabe junto da fênix fora do 3:1: nas outras formas o foco vai
 *           pra direita, mostra a fênix e esconde o logo por inteiro, em vez de deixá-lo cortado pela metade), por forma de tela ("ultrawide", "wide", "standard", "tall"; `default` vale pras que faltarem): "x% y%"
 * As formas vêm de features/mural-stage.js (data-shape do palco). Arquivos em assets/img/mural-art-*.webp. HOJE (2026-11-24): os 10 fundos de foto `fundo-01`..`fundo-10` (4:3, 1440x1080, com cabeçalho, selo de 10 anos e rodapé JÁ desenhados na imagem, por isso `contain`: nada é cortado); as artes antigas (sunset, invite, gumbleton) saíram a pedido do Renato.
 */
const MURAL_ARTS_VERSION = 3;
const muralArtFile = name => `assets/img/mural-art-${name}.webp?v=${MURAL_ARTS_VERSION}`;

const MURAL_ARTS = {
  "fundo-01": { file: muralArtFile("fundo-01"), alt: "DevFest Campinas 2026: Lagoa do Taquaral e a Caravela, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-02": { file: muralArtFile("fundo-02"), alt: "DevFest Campinas 2026: Torre do Castelo, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-03": { file: muralArtFile("fundo-03"), alt: "DevFest Campinas 2026: Estação Cultura, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-04": { file: muralArtFile("fundo-04"), alt: "DevFest Campinas 2026: Biblioteca da PUC-Campinas (Campus I), em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-05": { file: muralArtFile("fundo-05"), alt: "DevFest Campinas 2026: Vista aérea do Campus I da PUC-Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-06": { file: muralArtFile("fundo-06"), alt: "DevFest Campinas 2026: Pedreira do Chapadão, em aquarela", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-07": { file: muralArtFile("fundo-07"), alt: "DevFest Campinas 2026: Praça histórica de Campinas, em vetor plano", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-08": { file: muralArtFile("fundo-08"), alt: "DevFest Campinas 2026: Skyline de Campinas, em recorte de papel", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-09": { file: muralArtFile("fundo-09"), alt: "DevFest Campinas 2026: Taquaral à noite, em cartaz retrô", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-10": { file: muralArtFile("fundo-10"), alt: "DevFest Campinas 2026: Celebração do DevFest e Campinas, em mural geométrico", fit: "contain", focus: { default: "50% 50%" } },
};

const muralArtsRepository = createRepository(MURAL_ARTS, {
  get: id => MURAL_ARTS[id] ?? null,
});
