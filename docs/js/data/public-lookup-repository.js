/**
 * Repository de consulta pública por id conhecido (sem lista, sem login):
 * pra dado que o servidor grava (job do Sympla) e o site só lê, como
 * `registrations` e `event-stats`. Diferente de createFirestoreRepository,
 * que é por pessoa (uid) e de escrita do cliente. A regra de segurança
 * permite `get` e nega `list`: só quem já sabe o id consegue ler.
 * `type="module"` só por causa do SDK; expõe window.createPublicLookupRepository
 * pros repositories finos (registrations-repository.js etc.).
 */
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

function createPublicLookupRepository({ db, collectionName }) {
  return createRepository(null, {
    /** Dados do documento ou null se não existir. */
    async get(id) {
      const snap = await getDoc(doc(db, collectionName, id));
      return snap.exists() ? snap.data() : null;
    },
    async has(id) {
      return (await getDoc(doc(db, collectionName, id))).exists();
    },
  });
}

window.createPublicLookupRepository = createPublicLookupRepository;
