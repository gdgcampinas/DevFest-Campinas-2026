/**
 * Kit dos testes das REGRAS do Firestore (contra o emulador): o cenário e os atalhos que os arquivos de teste de regras
 * compartilham (pessoas, moderador, chaves de palestra com horário relativo a agora, asserções). Cada arquivo de teste
 * só descreve os casos da sua coleção. Rodar todos: DevFestIA/tools/questions/run-rules-tests.sh
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { anonymous, google, createDoc } = require("./firestore-emulator.js");

const skip = process.env.FIRESTORE_EMULATOR_HOST ? false : "rode com DevFestIA/tools/questions/run-rules-tests.sh (precisa do emulador)";
const windowOn = process.env.RULES_WINDOW === "on";
const onlyWithWindow = skip || (windowOn ? false : "só vale com a trava de horário ligada");
const onlyWithoutWindow = skip || (windowOn ? "só vale com a trava de horário desligada" : false);
const rules = fs.readFileSync(path.join(__dirname, "..", "..", "firebase", "firestore.rules"), "utf8");
const moderatorEmail = rules.match(/request\.auth\.token\.email in \['([^']+)'/)[1];

// ---------- cenário ----------
let counter = 0;
const nextId = prefix => `${prefix}${Date.now().toString(36)}${counter++}`;
const person = () => anonymous(nextId("u"));
const moderator = () => google(nextId("m"), moderatorEmail);

/** Trilha única por chamada (só letras, como o formato da chave exige): cada teste tem a sua palestra, sem dados de outro teste. */
const uniqueTrack = () => `t${Date.now().toString(36)}${counter++}`.replace(/[0-9]/g, digit => "abcdefghij"[digit]);

/** Chave de palestra que COMEÇOU há `startedMinAgo` minutos (negativo = começa daqui a N). Duração de 40 min, como na grade. */
function talkKeyStarted(startedMinAgo, track = uniqueTrack()) {
  const start = new Date(Date.now() - startedMinAgo * 60000);
  start.setUTCSeconds(0, 0);
  return `${start.toISOString()}|${track}`;
}
const LIVE = () => talkKeyStarted(10);
const NOT_STARTED = () => talkKeyStarted(-30);
const ENDED = () => talkKeyStarted(60);

const base = { edition: "2026" };
const checkin = (who, talkKey) => createDoc(who, "checkins", `${who.uid}_${talkKey}`, { ...base, entryKey: talkKey });
/** Pessoa com check-in na palestra. */
async function attendee(talkKey) {
  const who = person();
  const result = await checkin(who, talkKey);
  assert.ok(result.ok, `check-in de preparo falhou: ${JSON.stringify(result.body)}`);
  return who;
}
const denied = result => assert.ok(!result.ok && result.code === "PERMISSION_DENIED", `esperava PERMISSION_DENIED, veio ${result.status} ${JSON.stringify(result.body).slice(0, 200)}`);
const allowed = result => assert.ok(result.ok, `esperava sucesso, veio ${result.status} ${JSON.stringify(result.body).slice(0, 300)}`);

module.exports = { skip, onlyWithWindow, onlyWithoutWindow, rules, moderatorEmail, nextId, person, moderator, uniqueTrack, talkKeyStarted, LIVE, NOT_STARTED, ENDED, base, checkin, attendee, denied, allowed };
