/**
 * Favoritos do visitante ("Minha agenda"): conjunto de chaves de
 * palestra persistido no navegador de cada pessoa, sem backend.
 * A chave é estável (início do slot + trilha), então continua valendo
 * quando o line-up mock vira o real, desde que o horário se mantenha.
 */
const favoritesRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:favorites" });

function talkKey(slot, trackId) {
  return `${slot.start.toISOString()}|${trackId}`;
}
