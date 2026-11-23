/**
 * Plano da simulação de perguntas (puro, sem rede): transforma as perguntas de exemplo em escritas do Firestore, no formato que o site grava
 * (`talk-questions/<uid>_<talkKey>#1`, campos das regras) e SEMPRE na edição do DEV (`2026-dev`), nunca na de produção. Repetir a simulação
 * regrava os mesmos documentos (os ids são fixos), então não duplica nada.
 */
const { SAMPLE_QUESTIONS } = require("./sample-questions.js");

/** A palestra de número `index` (1 = a primeira) da trilha `trackId`, na ordem do horário. `talks` é o Map { talkKey -> { title, ... } } da grade do site. */
function pickTalk({ talks, trackId, index = 1 }) {
  const keys = [...talks.keys()].filter(key => key.endsWith(`|${trackId}`)).sort();
  const key = keys[index - 1];
  if (!key) throw new Error(`a trilha "${trackId}" não tem a palestra número ${index} (tem ${keys.length})`);
  return { key, title: talks.get(key).title };
}

function planSimulatedQuestions({ talkKey, edition, samples = SAMPLE_QUESTIONS }) {
  if (!edition.endsWith("-dev")) throw new Error(`a simulação só grava na edição do DEV (recebi "${edition}")`);
  return samples.map((sample, index) => {
    const uid = `sim-${index + 1}`;
    const entryKey = `${talkKey}#1`;
    return { set: ["talk-questions", `${uid}_${entryKey}`, { edition, entryKey, talkKey, uid, text: sample.text, name: sample.name, status: sample.status }] };
  });
}

if (typeof module !== "undefined") module.exports = { pickTalk, planSimulatedQuestions };
