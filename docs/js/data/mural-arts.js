/**
 * ARTES do mural (peças prontas de design usadas como cena ou como fundo). O formato do telão de LED ainda não é conhecido, então cada arte diz COMO se adapta a qualquer
 * proporção, por dado, sem CSS por arte:
 *   file    caminho (com ?v=, único lugar que sabe) | alt: descrição
 *   fit     "cover" (preenche a tela e corta o que sobrar) ou "contain" (aparece inteira, com a própria imagem desfocada no fundo). Use "contain" quando a arte tem
 *           TEXTO dentro (cortar perde palavras). Pode ser um objeto por forma de tela: { default: "cover", tall: "contain" }
 *   focus   ponto da imagem que NÃO pode ser cortado (no banner do pôr do sol, o logo vem na própria arte, à esquerda, e não cabe junto da fênix fora do 3:1: nas outras formas o foco vai
 *           pra direita, mostra a fênix e esconde o logo por inteiro, em vez de deixá-lo cortado pela metade), por forma de tela ("ultrawide", "wide", "standard", "tall"; `default` vale pras que faltarem): "x% y%"
 * As formas vêm de features/mural-stage.js (data-shape do palco). Arquivos em assets/img/mural-art-*.webp. HOJE (2026-11-24): os 10 fundos de foto `fundo-01`..`fundo-10` (4:3, 1440x1080, com cabeçalho, selo de 10 anos e rodapé JÁ desenhados na imagem, por isso `contain`: nada é cortado); e o lote v4 `fundo-v4-01`..`fundo-v4-30` (10 GTA, 10 realistas, 5 desenhos, 5 pinturas, PUC-Campinas e Campinas); as artes antigas (sunset, invite, gumbleton) saíram a pedido do Renato.
 */
const MURAL_ARTS_VERSION = 4;
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
  "fundo-v4-01": { file: muralArtFile("fundo-v4-01"), alt: "DevFest Campinas 2026: Auditório da PUC-Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-02": { file: muralArtFile("fundo-v4-02"), alt: "DevFest Campinas 2026: Alameda da PUC-Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-03": { file: muralArtFile("fundo-v4-03"), alt: "DevFest Campinas 2026: Campus central da PUC-Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-04": { file: muralArtFile("fundo-v4-04"), alt: "DevFest Campinas 2026: Jardim interno da PUC-Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-05": { file: muralArtFile("fundo-v4-05"), alt: "DevFest Campinas 2026: Biblioteca da PUC-Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-06": { file: muralArtFile("fundo-v4-06"), alt: "DevFest Campinas 2026: Passarela da PUC-Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-07": { file: muralArtFile("fundo-v4-07"), alt: "DevFest Campinas 2026: Estação de tijolos, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-08": { file: muralArtFile("fundo-v4-08"), alt: "DevFest Campinas 2026: Pedreira do Chapadão, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-09": { file: muralArtFile("fundo-v4-09"), alt: "DevFest Campinas 2026: Caravela no Taquaral, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-10": { file: muralArtFile("fundo-v4-10"), alt: "DevFest Campinas 2026: Igreja histórica de Campinas, em estilo GTA", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-11": { file: muralArtFile("fundo-v4-11"), alt: "DevFest Campinas 2026: Auditório da PUC-Campinas (frente), em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-12": { file: muralArtFile("fundo-v4-12"), alt: "DevFest Campinas 2026: Auditório da PUC-Campinas (vista aérea), em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-13": { file: muralArtFile("fundo-v4-13"), alt: "DevFest Campinas 2026: Palmeiras da PUC-Campinas, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-14": { file: muralArtFile("fundo-v4-14"), alt: "DevFest Campinas 2026: Jardim da PUC-Campinas, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-15": { file: muralArtFile("fundo-v4-15"), alt: "DevFest Campinas 2026: Biblioteca da PUC-Campinas, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-16": { file: muralArtFile("fundo-v4-16"), alt: "DevFest Campinas 2026: Vista aérea leste da PUC-Campinas, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-17": { file: muralArtFile("fundo-v4-17"), alt: "DevFest Campinas 2026: Corredor da PUC-Campinas, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-18": { file: muralArtFile("fundo-v4-18"), alt: "DevFest Campinas 2026: Caravela no Taquaral, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-19": { file: muralArtFile("fundo-v4-19"), alt: "DevFest Campinas 2026: Torre do Castelo, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-20": { file: muralArtFile("fundo-v4-20"), alt: "DevFest Campinas 2026: Panorama de Campinas, em estilo realista", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-21": { file: muralArtFile("fundo-v4-21"), alt: "DevFest Campinas 2026: Blocos da PUC-Campinas, em desenho", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-22": { file: muralArtFile("fundo-v4-22"), alt: "DevFest Campinas 2026: Estação, em desenho", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-23": { file: muralArtFile("fundo-v4-23"), alt: "DevFest Campinas 2026: Pedreira do Chapadão, em desenho", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-24": { file: muralArtFile("fundo-v4-24"), alt: "DevFest Campinas 2026: Igreja histórica, em desenho", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-25": { file: muralArtFile("fundo-v4-25"), alt: "DevFest Campinas 2026: Guarda-chuvas do centro, em desenho", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-26": { file: muralArtFile("fundo-v4-26"), alt: "DevFest Campinas 2026: Jardim da PUC-Campinas, em pintura", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-27": { file: muralArtFile("fundo-v4-27"), alt: "DevFest Campinas 2026: Biblioteca da PUC-Campinas, em pintura", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-28": { file: muralArtFile("fundo-v4-28"), alt: "DevFest Campinas 2026: Torre do Castelo, em pintura", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-29": { file: muralArtFile("fundo-v4-29"), alt: "DevFest Campinas 2026: Lagoa do Taquaral vista do alto, em pintura", fit: "contain", focus: { default: "50% 50%" } },
  "fundo-v4-30": { file: muralArtFile("fundo-v4-30"), alt: "DevFest Campinas 2026: Caravela no Taquaral, em pintura", fit: "contain", focus: { default: "50% 50%" } },
};

const muralArtsRepository = createRepository(MURAL_ARTS, {
  get: id => MURAL_ARTS[id] ?? null,
});
