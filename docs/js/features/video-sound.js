/**
 * Quando um vídeo do mural toca COM SOM (puro, dual). O telão fica num espaço do evento e o som de um clipe não pode competir com as salas: só toca com som nos momentos e nas fases do dado
 * (`rule: { moments: ["lunch", "closing"], phases: ["before", "after"] }`, momentos da grade em data/schedule.js e fases do evento); fora delas o mesmo clipe toca MUDO. Sem regra = sempre mudo.
 */
function videoSoundAllowed(rule, ctx) {
  if (!rule) return false;
  return (rule.moments ?? []).includes(ctx.moment) || (rule.phases ?? []).includes(ctx.phase);
}

if (typeof module !== "undefined") module.exports = { videoSoundAllowed };
