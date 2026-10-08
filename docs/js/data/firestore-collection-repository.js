/**
 * Fábrica de repository de uma COLEÇÃO pequena e inteira no Firestore (o terceiro irmão de firestore-repository.js, "um registro por pessoa", e de firestore-document-repository.js, "um documento por id"):
 * lista tudo ao vivo, grava por id e apaga por id, sem `edition` (serve a dado que vale pra todas as edições, como a lista de moderadores). `type="module"` só por causa do SDK; expõe
 * `window.createFirestoreCollectionRepository`. Só passa o que as regras do Firestore deixarem (hoje: só o dono mexe em `moderators`).
 */
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

function createFirestoreCollectionRepository({ db, collectionName }) {
  const col = () => collection(db, collectionName);
  return createRepository(null, {
    /** `onNext([{ id, ...dados }])` roda agora e a cada mudança (1 leitura por mudança); devolve a função que desliga. */
    listen(onNext, onError) {
      return onSnapshot(col(), snapshot => onNext(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))), onError);
    },
    /** Grava o documento inteiro, com o horário do servidor em `createdAt`. */
    async set(id, data) {
      await setDoc(doc(col(), id), { ...data, createdAt: serverTimestamp() });
    },
    async remove(id) {
      await deleteDoc(doc(col(), id));
    },
  });
}

window.createFirestoreCollectionRepository = createFirestoreCollectionRepository;
