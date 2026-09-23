#!/usr/bin/env node
/**
 * Raiz de composição do sync Sympla -> Firestore: só liga as peças
 * (repositories + caso de uso) a partir do ambiente. Rodado a cada 10 min
 * pelo workflow `.github/workflows/sync-sympla.yml`.
 *
 * Ambiente:
 *   SYMPLA_TOKEN             (secret) sem ele o job só avisa e sai com sucesso
 *   SYMPLA_EVENT_ID_HASH     hash do evento, não é segredo (ex.: s36cd5d)
 *   FIREBASE_SERVICE_ACCOUNT (secret) JSON da conta de serviço; sem ele roda em modo teste
 *   DRY_RUN=1                força modo teste (lê o Sympla, não grava nada)
 */
const fs = require("node:fs");
const { FIREBASE_CONFIG, CURRENT_EDITION } = require("../../../docs/js/data/firebase-config.js");
const { createServiceAccountAuth } = require("../lib/google-auth.js");
const { createFirestoreRestRepository } = require("../lib/firestore-rest.js");
const { createSymplaRepository } = require("./sympla-repository.js");
const { runSync } = require("./sync-use-case.js");
const { formatSummary } = require("./report.js");

async function main(env = process.env) {
  if (!env.SYMPLA_TOKEN || !env.SYMPLA_EVENT_ID_HASH) {
    console.log("SYMPLA_TOKEN ou SYMPLA_EVENT_ID_HASH ausente: nada a fazer (configure os secrets do repositório).");
    return;
  }
  const dryRun = env.DRY_RUN === "1" || !env.FIREBASE_SERVICE_ACCOUNT;
  const auth = dryRun ? { getAccessToken: async () => "" } : createServiceAccountAuth({
    serviceAccount: JSON.parse(env.FIREBASE_SERVICE_ACCOUNT),
    scope: "https://www.googleapis.com/auth/datastore",
  });
  const firestore = createFirestoreRestRepository({ projectId: FIREBASE_CONFIG.projectId, auth });
  // em modo teste nada é lido nem gravado no Firestore
  const database = dryRun ? { getDocument: async () => null, commit: async () => {} } : firestore;

  const result = await runSync({
    symplaRepository: createSymplaRepository({ token: env.SYMPLA_TOKEN, eventIdHash: env.SYMPLA_EVENT_ID_HASH }),
    database,
    edition: CURRENT_EDITION,
    dryRun,
  });

  const summary = formatSummary({ edition: CURRENT_EDITION, result });
  console.log(summary);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exit(1); });

module.exports = { main };
