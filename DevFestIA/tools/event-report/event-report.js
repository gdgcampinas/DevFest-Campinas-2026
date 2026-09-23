#!/usr/bin/env node
/**
 * Relatório pós-evento (raiz de composição). Rodado sob demanda pelo
 * workflow `.github/workflows/event-report.yml` (Actions > Run workflow),
 * o resultado aparece no resumo privado da execução.
 * Ambiente: SYMPLA_TOKEN, SYMPLA_EVENT_ID_HASH, FIREBASE_SERVICE_ACCOUNT (todos obrigatórios).
 */
const fs = require("node:fs");
const { FIREBASE_CONFIG, CURRENT_EDITION } = require("../../../docs/js/data/firebase-config.js");
const { createServiceAccountAuth } = require("../lib/google-auth.js");
const { createFirestoreRestRepository } = require("../lib/firestore-rest.js");
const { createSymplaRepository } = require("../sympla-sync/sympla-repository.js");
const { buildStats } = require("../sympla-sync/reconcile.js");
const { buildEventReport, formatEventReport } = require("./build-report.js");

async function main(env = process.env) {
  for (const name of ["SYMPLA_TOKEN", "SYMPLA_EVENT_ID_HASH", "FIREBASE_SERVICE_ACCOUNT"]) {
    if (!env[name]) throw new Error(`${name} ausente (configure os secrets do repositório)`);
  }
  const database = createFirestoreRestRepository({
    projectId: FIREBASE_CONFIG.projectId,
    auth: createServiceAccountAuth({ serviceAccount: JSON.parse(env.FIREBASE_SERVICE_ACCOUNT), scope: "https://www.googleapis.com/auth/datastore" }),
  });
  const sympla = createSymplaRepository({ token: env.SYMPLA_TOKEN, eventIdHash: env.SYMPLA_EVENT_ID_HASH });

  const [participants, checkins, talkFeedback, eventFeedback] = await Promise.all([
    sympla.listParticipants(),
    database.listDocuments("checkins"),
    database.listDocuments("talk-feedback"),
    database.listDocuments("event-feedback"),
  ]);
  const ofEdition = docs => docs.filter(doc => doc.edition === CURRENT_EDITION);
  const report = buildEventReport({
    stats: buildStats(participants, ["APPROVED"]),
    checkins: ofEdition(checkins),
    talkFeedback: ofEdition(talkFeedback),
    eventFeedback: ofEdition(eventFeedback),
  });
  const text = formatEventReport(report, { edition: CURRENT_EDITION });
  console.log(text);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exit(1); });

module.exports = { main };
