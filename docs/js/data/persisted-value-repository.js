/**
 * Repository de UM valor de texto persistido num storage injetado
 * (localStorage por padrão), irmão de persisted-set-repository.js: mesma
 * ideia (quem consome não sabe onde o dado mora), só que um valor em vez
 * de um conjunto. Storage indisponível nunca quebra: volta o padrão.
 */
function createPersistedValueRepository({ storageKey, storage = browserStorage(), defaultValue = "" }) {
  return createRepository(null, {
    get() {
      try {
        return storage?.getItem(storageKey) ?? defaultValue;
      } catch {
        return defaultValue;
      }
    },
    set(value) {
      try {
        storage?.setItem(storageKey, value);
      } catch {
        /* sem persistência: só não lembra na próxima vez */
      }
    },
  });
}
