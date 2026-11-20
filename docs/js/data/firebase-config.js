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

/**
 * DEV x PROD no mesmo banco: o modo DEV (`?lineup=1`, `/DEV/`) grava os dados de ATIVIDADE do evento (check-ins, avaliações, perguntas, votos,
 * sorteio, concurso) numa edição própria, `<edição>-dev` ("2026-dev"), que só o próprio modo DEV lê. O ensaio nunca mais mistura com o uso real
 * e a limpeza dos dados de teste do PROD (edição "2026") não toca no que é do DEV. Dado de REFERÊNCIA (inscritos do Sympla, estatísticas, moderadores,
 * recados e o resto do telão) fica sempre na edição de produção: o DEV precisa enxergar os inscritos reais e o telão é só produção.
 * Repositories não passam `edition`: createFirestoreRepository e createFirestoreDocumentRepository usam `editionFor(collectionName)`.
 * Página só de produção (o telão e os controles dele): `data-production-only` na tag deste script, e o modo DEV nunca vale nela.
 * ESPELHAR `isKnownEdition()` de DevFestIA/firebase/firestore.rules (um teste confere).
 */
const DEV_EDITION_SUFFIX = "-dev";
const KNOWN_EDITIONS = [CURRENT_EDITION, `${CURRENT_EDITION}${DEV_EDITION_SUFFIX}`];
const ACTIVITY_COLLECTIONS = [
  "checkins", "talk-feedback", "event-feedback", "talk-questions", "talk-question-votes", "talk-boards",
  "raffle-checkins", "raffle-entries", "raffle-draws", "raffle-session", "raffle-state",
  "contest-projects", "contest-votes", "contest-results",
];
const PRODUCTION_ONLY_PAGE = typeof document !== "undefined" && Boolean(document.currentScript?.dataset.productionOnly !== undefined); // lido na carga: `currentScript` só existe enquanto o script roda

/** A edição de uma coleção: a do DEV só para dado de atividade, com o modo DEV pedido e fora de página só de produção. Função pura (tudo por parâmetro). */
function resolveEdition({ collectionName, devMode = false, productionOnly = false, activity = ACTIVITY_COLLECTIONS, production = CURRENT_EDITION, suffix = DEV_EDITION_SUFFIX }) {
  return devMode && !productionOnly && activity.includes(collectionName) ? `${production}${suffix}` : production;
}

/** A edição que ESTA página usa para a coleção (`devLineupRequested` vem de data/schedule-builder.js, que carrega antes dos repositories). */
const editionFor = collectionName => resolveEdition({ collectionName, devMode: typeof devLineupRequested === "function" && devLineupRequested(), productionOnly: PRODUCTION_ONLY_PAGE });

// Dual: o job do Sympla (DevFestIA/tools/sympla-sync, Node) lê o mesmo projeto e edição do site.
if (typeof module !== "undefined") module.exports = { FIREBASE_CONFIG, CURRENT_EDITION, KNOWN_EDITIONS, DEV_EDITION_SUFFIX, ACTIVITY_COLLECTIONS, resolveEdition };
