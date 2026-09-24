/**
 * Modo ensaio: `?ensaio=HH:MM` (ou `AAAA-MM-DDTHH:MM`) desloca a grade INTEIRA pra a primeira palestra começar naquele
 * horário (hoje, no fuso do evento), preservando os intervalos. Serve pra testar o fluxo completo de perguntas, quadro
 * da sala e moderação com o banco de verdade em qualquer dia: as regras do Firestore olham o relógio real e o horário
 * que vem na chave da palestra, e a chave sai do horário da grade, então grade deslocada = chave de hoje.
 * Todo aparelho do ensaio (celular, TV, tablet do moderador) precisa usar o MESMO horário: os QR do quadro da sala
 * carregam o parâmetro sozinhos. Funções puras, arquivo "dual" (navegador e Node), testado em DevFestIA/tools/room.
 */
const MS_PER_MINUTE = 60000;

/** Milissegundos de um offset "-03:00". */
function offsetToMs(utcOffset) {
  const [, sign, hours, minutes] = utcOffset.match(/^([+-])(\d{2}):(\d{2})$/);
  return (sign === "-" ? -1 : 1) * (Number(hours) * 60 + Number(minutes)) * MS_PER_MINUTE;
}

/**
 * `agora` vira o "HH:MM" de 5 minutos atrás (no fuso do evento): a primeira palestra já começou e ainda dá ~35 min de
 * janela. O horário resolvido é o que os outros aparelhos devem usar (os QR do quadro já o carregam).
 */
function resolveRehearsalParam(param, now, utcOffset) {
  if (param !== "agora") return param;
  const local = new Date(now.getTime() - 5 * MS_PER_MINUTE + offsetToMs(utcOffset));
  return local.toISOString().slice(11, 16);
}

/** Date do início pedido, ou null se o formato for inválido. "HH:MM" vale pro dia de hoje no fuso do evento. */
function parseRehearsalStart(param, now, utcOffset) {
  const text = String(param ?? "");
  const clock = text.match(/^(\d{2}):(\d{2})$/);
  const full = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text);
  if (!clock && !full) return null;
  const today = new Date(now.getTime() + offsetToMs(utcOffset)).toISOString().slice(0, 10);
  const date = new Date(`${clock ? `${today}T${text}` : text}:00${utcOffset}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Quanto deslocar a grade (ms) pra a primeira palestra cair no horário pedido; null se o parâmetro não vale. */
function rehearsalDeltaMs(param, schedule, { now, utcOffset }) {
  const target = parseRehearsalStart(param, now, utcOffset);
  const firstTalk = schedule.find(slot => slot.talks);
  return target && firstTalk ? target.getTime() - firstTalk.start.getTime() : null;
}

/** Desloca, no lugar, o início e o fim de todos os itens da grade. */
function shiftSchedule(schedule, deltaMs) {
  schedule.forEach(slot => {
    slot.start = new Date(slot.start.getTime() + deltaMs);
    slot.end = new Date(slot.end.getTime() + deltaMs);
  });
  return schedule;
}

if (typeof module !== "undefined") module.exports = { parseRehearsalStart, resolveRehearsalParam, rehearsalDeltaMs, shiftSchedule };
