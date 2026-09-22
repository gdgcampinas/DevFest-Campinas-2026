/**
 * Config pública do app Web do Firebase (projeto "DevFest-Campinas",
 * console.firebase.google.com). Não é segredo: essa chave só identifica
 * o projeto pro navegador, quem protege os dados de verdade é a regra
 * de segurança do Firestore (Firebase Console → Firestore → Regras),
 * nunca esta chave nem a URL do GitHub Pages. Precisa carregar antes
 * de firebase-client.js.
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAtqK1GmCxK68pcPuh-asB8lcjc5Rkk97s",
  authDomain: "devfest-campinas.firebaseapp.com",
  projectId: "devfest-campinas",
  storageBucket: "devfest-campinas.firebasestorage.app",
  messagingSenderId: "360325359602",
  appId: "1:360325359602:web:731d753891129e19ebed6b",
};

/**
 * Edição do evento — o "ano" vira dado dentro de um projeto Firebase só
 * (nunca um projeto por ano: quebraria comparar crescimento entre
 * edições). Todo documento gravado no Firestore carrega este campo;
 * toda regra de segurança valida contra CURRENT_EDITION ou a lista de
 * edições conhecidas. Trocar de ano = editar só esta constante.
 */
const CURRENT_EDITION = "2026";
const KNOWN_EDITIONS = ["2026"];
