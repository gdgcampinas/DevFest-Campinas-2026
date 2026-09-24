/**
 * Inicializa o Firebase e expõe as duas portas de entrada que o site usa, cada uma com o seu app, o seu banco e o seu
 * login (o Firebase guarda o login por app, então um não interfere no outro, nem no mesmo navegador):
 *   window.firebaseClient   { app, db, auth, ensureAnonymousUid }   a PLATEIA: um uid anônimo por pessoa
 *   window.moderatorClient  { app, db, auth, signInWithGoogle, restoreModerator, signOutModerator }   o MODERADOR: conta Google
 * Antes os dois usavam o mesmo login: quem entrava como moderador virava, naquele navegador, a conta Google e perdia o
 * check-in feito como plateia (as regras exigem o check-in do uid atual). Separados, isso não acontece mais.
 *
 * Precisa ser `type="module"` (o SDK do Firebase 9+ só existe como ES module, vem do CDN oficial, sem npm/bundler, mesmo
 * espírito zero-build do resto do repo); os repositories que o consomem também são módulos, mas tudo que uma feature ou
 * página comum usa chega como `const` global de sempre: só o encanamento interno é módulo.
 *
 * Uma pessoa da plateia = um uid anônimo (sem senha nem e-mail): é o que a regra de segurança usa pra travar "1 registro
 * por pessoa por palestra" e "só posso criar o meu, nunca editar o de outra pessoa". ensureAnonymousUid() resolve assim
 * que o login anônimo completa (silencioso, sem tela). Se o login deste app for uma conta que não é anônima (sobra da época
 * em que o moderador usava o mesmo app), sai dela e volta pra anônimo.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import { connectEmulatorIfRequested } from "./firebase-emulator.js?v=3";

/** Abre um app Firebase (o padrão ou um nomeado), já ligado ao emulador quando o teste local pediu. */
function openApp(name) {
  const app = name ? initializeApp(FIREBASE_CONFIG, name) : initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const emulator = connectEmulatorIfRequested({ db, auth }); // null fora do teste local (ver firebase-emulator.js)
  return { app, db, auth, emulator };
}

// ---------- plateia ----------
const audience = openApp(null);
let uidPromise = null;

/** Resolve com o uid anônimo da pessoa, fazendo login se ainda não fez. Uma promise só, reusada por quem pedir. */
function ensureAnonymousUid() {
  if (uidPromise) return uidPromise;
  uidPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      audience.auth,
      async user => {
        try {
          if (user && !user.isAnonymous) await signOut(audience.auth); // sobra de conta Google neste app: volta pra anônimo
          else if (user) {
            unsubscribe();
            resolve(user.uid);
            return;
          }
          if (!audience.auth.currentUser) await signInAnonymously(audience.auth);
        } catch (error) {
          reject(error);
        }
      },
      reject
    );
  });
  return uidPromise;
}

window.firebaseClient = { app: audience.app, db: audience.db, auth: audience.auth, ensureAnonymousUid };

// ---------- moderador ----------
const moderator = openApp("moderator");

/**
 * Login com Google, só pra moderadores (tablet da sala): as regras do Firestore liberam aprovar pergunta apenas pra
 * e-mails da lista de moderadores. Resolve com o e-mail logado.
 */
async function signInWithGoogle() {
  if (moderator.emulator) return moderator.emulator.signInAsModerator();
  const { user } = await signInWithPopup(moderator.auth, new GoogleAuthProvider());
  return user.email;
}

/** E-mail da conta Google que já está logada neste aparelho (o login persiste entre recargas), ou null. */
function restoreModerator() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(moderator.auth, user => {
      unsubscribe();
      resolve(user && !user.isAnonymous ? user.email : null);
    });
  });
}

const signOutModerator = () => signOut(moderator.auth);

window.moderatorClient = { app: moderator.app, db: moderator.db, auth: moderator.auth, signInWithGoogle, restoreModerator, signOutModerator };
