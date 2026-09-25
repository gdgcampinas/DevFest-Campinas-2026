/**
 * Fábrica de repository de DOCUMENTOS únicos por id sobre o Firestore (o irmão de firestore-repository.js, que cuida
 * de "um registro por pessoa"): um documento por chave, lido por id e regravado inteiro. Serve ao quadro da palestra
 * (`talk-boards/<talkKey>`: a lista pública de perguntas na ordem certa, escrita pelo moderador e lida por todos).
 * `type="module"` só por causa do SDK; expõe `window.createFirestoreDocumentRepository`, usado pelos repositories
 * comuns como qualquer function global.
 */
import { collection, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

function createFirestoreDocumentRepository({ db, collectionName, edition }) {
  const ref = id => doc(collection(db, collectionName), id);
  const toItem = snapshot => (snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);

  return createRepository(null, {
    /** O documento ({ id, ...dados }) ou null se ainda não existe. */
    async get(id) {
      return toItem(await getDoc(ref(id)));
    },
    /** `onNext(documento | null)` roda agora e a cada mudança (1 leitura por mudança); devolve a função que desliga. */
    listen(id, onNext, onError) {
      return onSnapshot(ref(id), snapshot => onNext(toItem(snapshot)), onError);
    },
    /** Grava o documento inteiro (só passa se as regras deixarem: hoje, só o moderador). */
    async set(id, data) {
      await setDoc(ref(id), { ...data, edition, updatedAt: serverTimestamp() });
    },
  });
}

window.createFirestoreDocumentRepository = createFirestoreDocumentRepository;
