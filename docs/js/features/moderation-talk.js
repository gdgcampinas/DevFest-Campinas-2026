/**
 * Feature: qual palestra de uma trilha a moderação enxerga agora. A que está rolando na sala ou, entre palestras, a última que terminou (dá tempo de responder as perguntas). `pinnedSlot`
 * (de `?palestra=<código>`) vale em qualquer dia e horário. Devolve { key, title, data, questionsEnabled } ou null. Fica à parte da tela pra que a moderação de perguntas e a área de admin
 * (contagem de perguntas pendentes por trilha) usem a MESMA regra. Tudo por parâmetro: `schedule`, `track`, `now`, `allowsQuestions` (padrão: sempre).
 */
function pickModerationTalk({ schedule, track, now, pinnedSlot = null, allowsQuestions = () => true }) {
  const describe = slot => ({ key: talkKey(slot, track.id), title: slot.talks[track.id].title, data: slot.talks[track.id], questionsEnabled: allowsQuestions(slot.talks[track.id]) });
  if (pinnedSlot) return describe(pinnedSlot);
  const talkSlots = schedule.filter(slot => slot.talks?.[track.id]);
  const state = resolveEventState(now, schedule);
  const slot = state.phase === "live" && state.activeSlot?.talks?.[track.id]
    ? state.activeSlot
    : talkSlots.filter(candidate => candidate.end <= now).pop();
  return slot ? describe(slot) : null;
}
