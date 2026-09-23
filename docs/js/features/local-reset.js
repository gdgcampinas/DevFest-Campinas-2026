/**
 * Limpeza dos dados locais do site NESTE navegador (só de quem abre a
 * página): check-ins, avaliações, nome, favoritos, o usuário anônimo do
 * Firebase, caches e service worker. Serve pra refazer um teste do zero.
 * `resetLocalData` recebe todas as APIs do navegador por parâmetro (nada
 * global aqui), então é testável e cada uma é opcional (modo privado,
 * navegador embutido). `prefix` limita o que sai do localStorage e do
 * sessionStorage às chaves do site.
 */
const FIREBASE_DATABASES = ["firebaseLocalStorageDb", "firebase-installations-database", "firebase-heartbeat-database"];

function removePrefixedKeys(storage, prefix) {
  try {
    const keys = Object.keys(storage ?? {}).filter(key => key.startsWith(prefix));
    keys.forEach(key => storage.removeItem(key));
    return keys.length;
  } catch {
    return 0;
  }
}

function deleteDatabase(indexedDB, name) {
  return new Promise(resolve => {
    try {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      request.onblocked = () => resolve(true);
    } catch {
      resolve(false);
    }
  });
}

async function resetLocalData({ prefix, localStorage, sessionStorage, indexedDB, caches, serviceWorker, databases = FIREBASE_DATABASES }) {
  const cacheNames = caches ? await caches.keys().catch(() => []) : [];
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  const workers = serviceWorker ? await serviceWorker.getRegistrations().catch(() => []) : [];
  await Promise.all(workers.map(worker => worker.unregister()));
  const cleared = indexedDB ? (await Promise.all(databases.map(name => deleteDatabase(indexedDB, name)))).filter(Boolean).length : 0;
  return {
    local: removePrefixedKeys(localStorage, prefix),
    session: removePrefixedKeys(sessionStorage, prefix),
    databases: cleared,
    caches: cacheNames.length,
    workers: workers.length,
  };
}

/** Liga o botão da página: pede confirmação inline, limpa e mostra o resultado. */
function initLocalReset(rootEl, { reset, resultMarkupFn }) {
  const button = rootEl.querySelector("[data-reset-run]");
  const resultEl = rootEl.querySelector("[data-reset-result]");
  button.addEventListener("click", async () => {
    button.disabled = true;
    resultEl.innerHTML = resultMarkupFn(await reset());
    button.disabled = false;
  });
}
