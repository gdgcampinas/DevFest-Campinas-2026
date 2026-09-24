/**
 * Inicializa o app Firebase e expõe { app, db, auth, ensureAnonymousUid }
 * em window.firebaseClient — a única porta de entrada pro SDK que o
 * resto do site usa. Precisa ser `type="module"` (o SDK do Firebase 9+
 * só existe como ES module, vem do CDN oficial, sem npm/bundler, mesmo
 * espírito zero-build do resto do repo); os repositories que o
 * consomem (checkin-repository.js etc.) também são módulos, mas tudo
 * que uma feature/página comum usa (checkinRepository, feedbackRepository)
 * chega a elas como `const` global de sempre — só o encanamento interno
 * é módulo, ninguém fora daqui precisa saber disso.
 *
 * Uma pessoa = um uid anônimo (Firebase Authentication, sem senha nem
 * e-mail): é o que a regra de segurança usa pra travar "1 registro por
 * pessoa por palestra" e "só posso criar o meu, nunca editar o de
 * outra pessoa". ensureAnonymousUid() resolve assim que o login
 * anônimo completa (silencioso, sem tela).
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);

let uidPromise = null;

/** Resolve com o uid anônimo da pessoa, fazendo login se ainda não fez. Uma promise só, reusada por quem pedir. */
function ensureAnonymousUid() {
  if (uidPromise) return uidPromise;
  uidPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        if (!user) return;
        unsubscribe();
        resolve(user.uid);
      },
      reject
    );
    if (!auth.currentUser) signInAnonymously(auth).catch(reject);
  });
  return uidPromise;
}

/**
 * Login com Google, só pra moderadores (tablet da sala): as regras do Firestore liberam ocultar pergunta
 * apenas pra e-mails da lista de moderadores. O público segue anônimo. Resolve com o e-mail logado.
 */
async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
  return user.email;
}

/** Sai do Google e volta pra sessão anônima (uid novo) na próxima chamada de ensureAnonymousUid. */
async function signOutModerator() {
  await signOut(auth);
  uidPromise = null;
}

window.firebaseClient = { app, db, auth, ensureAnonymousUid, signInWithGoogle, signOutModerator };
