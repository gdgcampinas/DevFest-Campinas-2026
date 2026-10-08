/**
 * Fontes AO VIVO do mural (features/mural-live.js, mural-live-sources.js). Cada fonte é um repository com contrato único (`get` por polling ou
 * `listen`), então trocar a origem de um dado (ou ligar a foto ao vivo na Fase 2) é editar este arquivo, não o motor.
 *
 *   id          nome da fonte (as cenas pedem `requires.live` com esse nome)
 *   kind        "poll" (lê de tempos em tempos: `repository.get`) | "document" (escuta o documento: `repository.listen`, 1 leitura por mudança)
 *   repository  nome em pages/mural.js (window.eventStatsRepository, window.contestResultsRepository...)
 *   key | keys  documento fixo, ou o nome de um resolvedor de várias chaves (uma escuta por chave: "contest-sessions" = sessões com concurso)
 *   enabled     false desliga a fonte inteira
 *   bind        o que a mudança faz no mural: `live` (nome no contexto das cenas); `pick` (campo do documento que é a lista de itens: o estado vira
 *               { key, items } e só vale com itens); `interrupt` (cena que entra na frente quando a lista acaba de ser publicada ao vivo) e `celebrate` (papel picado, depois de `celebrateDelayMs`: o pódio entra do 3º ao 1º)
 */
const MURAL_SOURCES = [
  {
    id: "registered", kind: "poll", repository: "eventStats", key: CURRENT_EDITION, intervalMs: 5 * 60000,
    bind: { live: "registered" },
  },
  {
    id: "podium", kind: "document", repository: "contestResults", keys: "contest-sessions",
    bind: { live: "podium", pick: "podium", interrupt: { sceneId: "podio-jam", priority: 100, ttlMs: 3 * 60000, immediate: true }, celebrate: true, celebrateDelayMs: MURAL_CONFIG.motion.podiumStepMs * 2 + 1100 },
  },
];

const muralSourcesRepository = createRepository(MURAL_SOURCES);
