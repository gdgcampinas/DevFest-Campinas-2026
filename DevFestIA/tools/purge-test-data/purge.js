#!/usr/bin/env node
/**
 * Raiz de composição da limpeza dos dados de teste (workflow
 * `.github/workflows/purge-test-data.yml`, sob demanda). Ambiente:
 *   FIREBASE_SERVICE_ACCOUNT (secret, obrigatório)
 *   DRY_RUN=1 (padrão do workflow: só conta) | vazio = apaga, se a confirmação bater
 *   CONFIRM=APAGAR
 */
const fs = require("node:fs");
const { FIREBASE_CONFIG, CURRENT_EDITION } = require("../../../docs/js/data/firebase-config.js");
const { createServiceAccountAuth } = require("../lib/google-auth.js");
const { createFirestoreRestRepository } = require("../lib/firestore-rest.js");
const { readSiteSchedule } = require("../event-report/site-schedule.js");
const { planPurge } = require("./purge-plan.js");
const { runPurge } = require("./purge-use-case.js");

const summary = report => [
  `## Limpeza de dados de teste, DevFest ${CURRENT_EDITION}`,
  "",
  "| Coleção | Encontrados | Apagados |",
  "|---|---|---|",
  ...Object.entries(report).map(([collection, count]) => `| ${collection} | ${count.found} | ${count.deleted} |`),
].join("\n");

async function main(env = process.env, now = new Date()) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) throw new Error("FIREBASE_SERVICE_ACCOUNT ausente (configure o secret do repositório)");
  const plan = planPurge({ dryRun: env.DRY_RUN === "1", confirm: env.CONFIRM ?? "", now, startsAt: readSiteSchedule().startsAt });
  if (!plan.allowed) throw new Error(plan.reason);

  const database = createFirestoreRestRepository({
    projectId: FIREBASE_CONFIG.projectId,
    auth: createServiceAccountAuth({ serviceAccount: JSON.parse(env.FIREBASE_SERVICE_ACCOUNT), scope: "https://www.googleapis.com/auth/datastore" }),
  });
  const report = await runPurge({ database, edition: CURRENT_EDITION, deleting: plan.deleting });
  const text = `${summary(report)}\n\n${plan.deleting ? "Documentos apagados." : "Modo teste: nada foi apagado."}`;
  console.log(text);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exit(1); });

module.exports = { main };
