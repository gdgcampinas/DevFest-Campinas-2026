/**
 * Decide o que o quadro da sala mostra a cada instante. Função pura, arquivo "dual" (navegador e Node), testada em
 * DevFestIA/tools/room. Reúne o que antes estava espalhado na tela da sala: a palestra ligada à sala, a fase das
 * perguntas e os QR (check-in da atual, avaliação da anterior, avaliação do evento).
 *
 * Entrada (tudo por parâmetro): `schedule`, `track` (a sala), `siteUrl`, `now`, `extraQuery` (o que os QR carregam a mais,
 * ex.: "&ensaio=14:30&lineup=1" pra outros aparelhos entrarem no mesmo ensaio), e duas funções de chave já existentes no
 * site: `keyOf(slot, trackId)` (chave da palestra, talkKey) e `codeOf(slot, trackId)` (código curto do QR, talkShareCode).
 *
 * Saída: { message?, panels?, talk, questionsPhase }
 *   talk           a palestra que a sala mostra: { kind: "live" | "last", slot, data, key, progress } ou null.
 *                  "live" = está rolando agora; "last" = a que acabou de terminar, até a próxima começar (o palestrante
 *                  ainda pode responder as perguntas já aprovadas). Depois do fim do evento não há palestra na sala.
 *   questionsPhase "open" (palestra rolando) | "closed" (acabou) | null
 *   panels         QR (mesma forma de sempre) ou `message` quando não há nada pra mostrar.
 */
const roomCheckinUrl = (code, siteUrl, extraQuery = "") => `${siteUrl}grade.html?checkin=${code}${extraQuery}`;
const roomRateUrl = (code, siteUrl, extraQuery = "") => `${siteUrl}grade.html?avaliar=${code}${extraQuery}`;
const roomRateEventUrl = (siteUrl, extraQuery = "") => `${siteUrl}index.html?avaliar=1${extraQuery}`;

function resolveRoomBoard({ schedule, track, siteUrl, now, keyOf, codeOf, extraQuery = "" }) {
  const eventStart = schedule[0].start;
  const eventEnd = schedule[schedule.length - 1].end;
  if (now < eventStart) return { message: "O evento ainda não começou.", talk: null, questionsPhase: null };

  const talkSlots = schedule.filter(slot => slot.talks?.[track.id]);
  const finished = talkSlots.filter(slot => slot.end <= now).pop();
  const eventOver = now >= eventEnd;
  const active = eventOver ? null : talkSlots.find(slot => now >= slot.start && now < slot.end) ?? null;

  const describe = (slot, kind, progress = 1) => ({ kind, slot, data: slot.talks[track.id], key: keyOf(slot, track.id), progress });
  const talk = active ? describe(active, "live", (now - active.start) / (active.end - active.start))
    : finished && !eventOver ? describe(finished, "last")
    : null;

  const panels = [];
  if (finished) {
    panels.push({ id: "cdRate", kind: "rate", heading: active ? "Avalie a palestra anterior" : "Avalie esta palestra", title: finished.talks[track.id].title, hint: "Escaneie pra avaliar (seu check-in é registrado junto)", url: roomRateUrl(codeOf(finished, track.id), siteUrl, extraQuery) });
  }
  if (active) {
    panels.push({ id: "cdCheckin", kind: "checkin", heading: "Check-in nesta palestra", title: active.talks[track.id].title, hint: "Aponte a câmera do celular pro QR code pra fazer check-in", url: roomCheckinUrl(codeOf(active, track.id), siteUrl, extraQuery) });
  }
  if (eventOver) {
    panels.push({ id: "cdEvent", kind: "rate", heading: "Avalie o evento", title: "DevFest Campinas", hint: "Obrigado por participar! Conte como foi", url: roomRateEventUrl(siteUrl, extraQuery) });
  }
  const questionsPhase = !talk ? null : talk.kind === "live" ? "open" : "closed";
  return panels.length ? { panels, talk, questionsPhase } : { message: "Nenhuma palestra agora nesta sala.", talk, questionsPhase };
}

if (typeof module !== "undefined") module.exports = { resolveRoomBoard, roomCheckinUrl, roomRateUrl, roomRateEventUrl };
