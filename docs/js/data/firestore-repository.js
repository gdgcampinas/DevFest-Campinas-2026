/**
 * Fábrica de repository sobre o Firestore — mesmo contrato dos outros
 * repositories do repo (getAll/has, ver repository.js e
 * persisted-set-repository.js), só que a fonte de dado agora é
 * compartilhada entre visitantes, não local. `type="module"` só por
 * causa do SDK (import do CDN); expõe `window.createFirestoreRepository`
 * pra qualquer repository *comum* (checkin-repository.js etc.) usar
 * como uma function global qualquer, sem precisar virar módulo também.
 *
 * Um documento por pessoa+chave (`docId = uid_entryKey`), sempre criado
 * via `setDoc`: a regra de segurança do Firestore distingue create
 * (documento não existia) de update (já existia) e permite só o
 * primeiro — é isso que trava "1 registro por pessoa por entrada",
 * não uma checagem no cliente (que dá pra burlar).
 */
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

function createFirestoreRepository({ db, collectionName, edition }) {
  const col = () => collection(db, collectionName);
  const docId = (uid, entryKey) => `${uid}_${entryKey}`;

  return createRepository(null, {
    /**
     * Cria o registro da pessoa pra essa chave (idempotente: se já existe,
     * a regra de segurança recusa como "update" e a promise rejeita — quem
     * chama trata isso como "já registrado", não como erro de rede).
     */
    async add(uid, entryKey, data) {
      const ref = doc(col(), docId(uid, entryKey));
      await setDoc(ref, { ...data, edition, createdAt: serverTimestamp() });
      return ref.id;
    },
    /** Se a pessoa já tem registro pra essa chave. */
    async has(uid, entryKey) {
      const snap = await getDoc(doc(col(), docId(uid, entryKey)));
      return snap.exists();
    },
    /** Todos os registros da pessoa numa lista de chaves (ex.: quais palestras já avaliou). */
    async getMineFor(uid, entryKeys) {
      const found = new Set();
      await Promise.all(
        entryKeys.map(async entryKey => {
          if (await createFirestoreRepository({ db, collectionName, edition }).has(uid, entryKey)) found.add(entryKey);
        })
      );
      return found;
    },
    /** Todos os registros de uma chave (ex.: todo feedback de uma palestra), só leitura agregada — sem dado de outra pessoa individual. */
    async getAllFor(entryKey) {
      const snap = await getDocs(query(col(), where("entryKey", "==", entryKey), where("edition", "==", edition)));
      return snap.docs.map(d => d.data());
    },
  });
}

window.createFirestoreRepository = createFirestoreRepository;
