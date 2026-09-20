/**
 * Repository de um conjunto de strings persistido num storage
 * injetado (localStorage por padrão). Mesmo contrato dos outros
 * repositories (getAll) mais os métodos próprios de um conjunto:
 * has/count/toggle/subscribe. Quem consome não sabe onde o dado
 * mora — trocar `storage` (ou esta fábrica por uma que chame uma
 * API) não muda nenhum consumidor.
 *
 * Storage indisponível (modo privado, bloqueado) nunca quebra: o
 * conjunto segue funcionando em memória durante a sessão.
 */
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createPersistedSetRepository({ storageKey, storage = browserStorage() }) {
  const items = new Set(read());
  const listeners = new Set();

  function read() {
    try {
      const parsed = JSON.parse(storage?.getItem(storageKey) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function write() {
    try {
      storage?.setItem(storageKey, JSON.stringify([...items]));
    } catch {
      /* sem persistência: segue só em memória */
    }
  }

  return createRepository(null, {
    getAll: () => [...items],
    has: key => items.has(key),
    count: () => items.size,
    /** Liga/desliga a chave e devolve o novo estado (true = presente). */
    toggle(key) {
      if (items.has(key)) items.delete(key);
      else items.add(key);
      write();
      listeners.forEach(listener => listener());
      return items.has(key);
    },
    /** Adiciona várias chaves de uma vez (uma única gravação e um único aviso). Devolve quantas eram novas. */
    addAll(keys) {
      const before = items.size;
      keys.forEach(key => items.add(key));
      write();
      listeners.forEach(listener => listener());
      return items.size - before;
    },
    /** Retorna a função que cancela a inscrição. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}
