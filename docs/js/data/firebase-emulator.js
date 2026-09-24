/**
 * Liga o site ao Firebase LOCAL (emulador) só quando pedido e só em endereço local (localhost ou 127.0.0.1): `?emulador=1` (fica guardado na aba,
 * `?emulador=0` desliga). Serve pra rodar o fluxo completo (perguntas, moderação, quadro da sala) com o código e as
 * regras de verdade sem tocar no banco real. Em qualquer outro endereço isto não faz nada.
 * Sobe com: DevFestIA/tools/emulator/start.sh (Firestore 8085, Auth 9099).
 *
 * O login Google do moderador é falso no emulador: usa uma credencial de mentira com o e-mail de `?moderador=<e-mail>`
 * (padrão: o primeiro da lista das regras), que o emulador de Auth aceita.
 */
import { connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { connectAuthEmulator, signInWithCredential, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const SESSION_KEY = "devfest-campinas-2026:emulator";
const DEFAULT_MODERATOR = "gdgcampinascontato@gmail.com";

/** Endereços locais: cada um é uma "origem" separada (login e armazenamento próprios), o que permite testar pessoas diferentes em abas diferentes. */
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

function emulatorRequested() {
  if (!LOCAL_HOSTS.includes(location.hostname)) return false;
  const param = new URLSearchParams(location.search).get("emulador");
  try {
    if (param === "0") sessionStorage.removeItem(SESSION_KEY);
    else if (param) sessionStorage.setItem(SESSION_KEY, "1");
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return param === "1";
  }
}

let labelShown = false;
function showEmulatorLabel() {
  if (labelShown) return;
  labelShown = true;
  const label = document.createElement("div");
  label.textContent = "EMULADOR (banco local, nada vai pro Firebase de verdade)";
  label.style.cssText = "position:fixed;left:0;bottom:0;z-index:9999;background:#7c3aed;color:#fff;font:700 11px sans-serif;padding:3px 8px";
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(label));
}

/** Devolve { signInAsModerator } quando o emulador foi ligado, ou null (uso normal). */
export function connectEmulatorIfRequested({ db, auth }) {
  if (!emulatorRequested()) return null;
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  showEmulatorLabel();
  return {
    async signInAsModerator(email = new URLSearchParams(location.search).get("moderador") ?? DEFAULT_MODERATOR) {
      const credential = GoogleAuthProvider.credential(JSON.stringify({ sub: `google-${email}`, email, email_verified: true }));
      return (await signInWithCredential(auth, credential)).user.email;
    },
  };
}
