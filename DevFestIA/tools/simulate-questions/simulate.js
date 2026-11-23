#!/usr/bin/env node
/**
 * Raiz de composição da SIMULAÇÃO de perguntas de palestra no DEV (workflow `.github/workflows/simulate-questions.yml`, sob demanda).
 * Grava umas perguntas de exemplo na edição do DEV (`2026-dev`) pra testar a tela do moderador e o quadro da sala sem esperar a palestra
 * (as regras do Firestore só deixam a plateia perguntar com a palestra no ar). Ambiente:
 *   FIREBASE_SERVICE_ACCOUNT (secret, obrigatório)  |  TRACK = id da trilha (padrão "ia")  |  TALK = número da palestra na trilha, 1 = a primeira (padrão 1)
 */
const fs = require("node:fs");
const { FIREBASE_CONFIG, CURRENT_EDITION, DEV_EDITION_SUFFIX } = require("../../../docs/js/data/firebase-config.js");
const { createServiceAccountAuth } = require("../lib/google-auth.js");
const { createFirestoreRestRepository } = require("../lib/firestore-rest.js");
const { readSiteSchedule } = require("../event-report/site-schedule.js");
const { pickTalk, planSimulatedQuestions } = require("./simulate-plan.js");

async function main(env = process.env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) throw new Error("FIREBASE_SERVICE_ACCOUNT ausente (configure o secret do repositório)");
  const trackId = env.TRACK || "ia";
  const talk = pickTalk({ talks: readSiteSchedule().talks, trackId, index: Number(env.TALK || 1) });
  const edition = `${CURRENT_EDITION}${DEV_EDITION_SUFFIX}`;
  const writes = planSimulatedQuestions({ talkKey: talk.key, edition });
  const database = createFirestoreRestRepository({
    projectId: FIREBASE_CONFIG.projectId,
    auth: createServiceAccountAuth({ serviceAccount: JSON.parse(env.FIREBASE_SERVICE_ACCOUNT), scope: "https://www.googleapis.com/auth/datastore" }),
  });
  await database.commit(writes, { stampField: "createdAt" });
  const base = "https://gdgcampinas.github.io/DevFest-Campinas-2026";
  const text = [
    `## Perguntas simuladas no DEV (edição ${edition})`,
    "",
    `Palestra: **${talk.title}** (trilha \`${trackId}\`), ${writes.length} perguntas.`,
    "",
    `- Moderação: ${base}/moderacao.html?trilha=${trackId}&lineup=1`,
    `- Quadro da sala: ${base}/checkin-display.html?trilha=${trackId}&lineup=1`,
  ].join("\n");
  console.log(text);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exit(1); });

module.exports = { main };
