/**
 * "Linha do dia" do mural (regra PURA, dual: navegador e Node, testada em DevFestIA/tools/mural/day-timeline.test.js): a grade inteira como uma linha de blocos (credenciamento, palestras, almoço...)
 * com o estado de cada um em relação a `now` e a conta de quantos blocos de palestra já passaram. Quem desenha é a cena (components/mural-scenes/mural-day-timeline-scene.js).
 * Cada bloco: { index, kind: "talks" | "banner", label, start, end, minutes, status: "past" | "now" | "future", highlight }. `label` de bloco de palestras é "Palestras" (a ordem entre os blocos
 * de palestras vem em `talkNumber`, de 1); `highlight` é o nome do destaque da sessão (ex.: "Coding Jam") se algum talk do bloco tem, via `highlightLabelOf(talkData)` injetado.
 * Resultado: { blocks, talksDone, talksTotal, progress (0 a 1 do dia), current (bloco no ar ou null), next (o próximo bloco ou null) }.
 */
function buildDayTimeline({ schedule, now, highlightLabelOf = () => null }) {
  let talkNumber = 0;
  const blocks = schedule.map((slot, index) => {
    const isTalks = Boolean(slot.talks);
    if (isTalks) talkNumber += 1;
    const highlight = isTalks ? Object.values(slot.talks).map(highlightLabelOf).find(Boolean) ?? null : null;
    return {
      index, kind: isTalks ? "talks" : "banner", label: isTalks ? "Palestras" : slot.banner, moment: slot.moment ?? null,
      start: slot.start, end: slot.end, minutes: Math.max(1, Math.round((slot.end - slot.start) / 60000)),
      status: now >= slot.end ? "past" : now >= slot.start ? "now" : "future", highlight, ...(isTalks ? { talkNumber } : {}),
    };
  });
  const first = schedule[0].start;
  const last = schedule[schedule.length - 1].end;
  const talks = blocks.filter(block => block.kind === "talks");
  const current = blocks.find(block => block.status === "now") ?? null;
  return {
    blocks,
    talksDone: talks.filter(block => block.status === "past").length,
    talksTotal: talks.length,
    progress: Math.min(1, Math.max(0, (now - first) / (last - first))),
    current,
    next: blocks.find(block => block.status === "future") ?? null,
  };
}

if (typeof module !== "undefined") module.exports = { buildDayTimeline };
