/**
 * Construtores de grade — schedule.js/schedule.dev.js só declaram o
 * "plano do dia" (banners + blocos de palestra); a matemática de horário
 * e o mock de talks ficam aqui, uma vez só, por parâmetro.
 * Precisa carregar antes de schedule.dev.js/schedule.js.
 */

/** Chave (sessionStorage) do modo DEV: a mesma que o app.js usa para lembrar o `?lineup=1` na aba. */
const DEV_MODE_STORAGE_KEY = "devfest-campinas-2026:dev-mode";

/**
 * O modo DEV (line-up real antes da revelação) foi pedido? `?lineup=1` na URL, ou já gravado na aba, a menos que a URL traga `?lineup=0`. Lê só (não grava): quem grava é o app.js.
 * `search` e `storage` entram por parâmetro (testes).
 */
function devLineupRequested({ search = typeof location === "undefined" ? "" : location.search, storage = typeof sessionStorage === "undefined" ? null : sessionStorage } = {}) {
  const param = typeof URLSearchParams === "undefined" ? null : new URLSearchParams(search).get("lineup"); // sem URLSearchParams (ferramentas em Node) = PROD
  if (param !== null) return param === "1";
  try { return storage?.getItem(DEV_MODE_STORAGE_KEY) === "1"; } catch { return false; }
}

function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function toHHMM(totalMinutes) {
  const pad = n => String(n).padStart(2, "0");
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/**
 * N janelas consecutivas a partir de `startHHMM`: cada uma dura
 * `talkMin` (palestra + perguntas) e é seguida de `gapMin` de troca.
 * Ex.: talkWindows("09:00", 2) → 09:00-09:40, 09:45-10:25.
 */
function talkWindows(startHHMM, count, { talkMin = 40, gapMin = 5 } = {}) {
  const start = toMinutes(startHHMM);
  return Array.from({ length: count }, (_, i) => {
    const windowStart = start + i * (talkMin + gapMin);
    return { start: toHHMM(windowStart), end: toHHMM(windowStart + talkMin) };
  });
}

/** Talk provisória (uma por trilha) — fallback quando o catálogo não cobre o slot. `rotateSpeakers` (padrão) rotaciona o pool de palestrantes; `false` deixa a vaga sem ninguém (line-up real: nunca põe uma pessoa onde não foi escalada). */
function placeholderTalks(tracks, speakerPool, talkIndex, { rotateSpeakers = true } = {}) {
  return Object.fromEntries(tracks.map((track, i) => [
    track.id,
    {
      speakers: rotateSpeakers ? [speakerPool[(talkIndex * tracks.length + i) % speakerPool.length]] : [],
      title: "Título a confirmar",
      vacant: true, // vaga sem palestra definida: o telão não a mostra como "agora" nem "a seguir"
      format: "palestra",
      description: "",
    },
  ]));
}

/**
 * Talks do catálogo para uma janela: liga cada `speakerIds` às pessoas
 * do pool (mesmos objetos, sem cópia). Id que não existe no pool é
 * avisado no console e ignorado, pra erro de dado nunca passar em branco.
 * Trilha sem palestra no catálogo cai no fallback só daquela trilha.
 */
function catalogTalks(tracks, speakerPool, talkCatalog, talkIndex, placeholderOptions) {
  const fallback = placeholderTalks(tracks, speakerPool, talkIndex, placeholderOptions);
  return Object.fromEntries(tracks.map(track => {
    const entry = talkCatalog.getFor(track.id, talkIndex);
    if (!entry) return [track.id, fallback[track.id]];
    const { speakerIds = [], ...talk } = entry;
    const speakers = speakerIds.map(id => {
      const speaker = speakerPool.find(candidate => candidate.id === id);
      if (!speaker) console.warn(`[schedule] palestrante "${id}" não existe (trilha ${track.id}, palestra ${talkIndex})`);
      return speaker;
    }).filter(Boolean);
    return [track.id, { ...talk, speakers }];
  }));
}

/**
 * Plenária (sessão combinada com palestrante): troca `speakerIds` pelos palestrantes do pool, como as palestras das trilhas, e monta a fala (`talk`)
 * que a sala da plenária (`trackId`) mostra no modal, na galeria de palestrantes, no feedback e no calendário. A plenária não tem perguntas ao vivo
 * (destaque "plenaria" em data/talk-highlights.js).
 */
function resolveKeynote({ speakerIds = [], ...keynote }, speakerPool) {
  const speakers = speakerIds.map(id => {
    const speaker = speakerPool.find(candidate => candidate.id === id);
    if (!speaker) console.warn(`[schedule] palestrante "${id}" não existe (plenária)`);
    return speaker;
  }).filter(Boolean);
  const talk = { title: keynote.title, format: "palestra", highlight: "plenaria", tags: [], speakers, description: keynote.description ?? "" };
  return { ...keynote, speakers, talk };
}

/** A fala de cada trilha numa sessão: as palestras paralelas (`talks`) ou, na plenária, a única fala dela, na trilha da sala (`keynote.trackId`). Faixa comum: nenhuma. */
function slotTalks(slot) {
  if (slot.talks) return slot.talks;
  return slot.keynote ? { [slot.keynote.trackId]: slot.keynote.talk } : {};
}

/**
 * Plano do dia → SCHEDULE. Cada item do plano é:
 *   { banner, moment?, room?, start, end }   → sessão combinada (credenciamento, almoço...); `moment` é o nome estável dela (o mural liga cenas por momento)
 *     `keynote` (opcional) = { title, trackId, speakerIds, description }: a sessão combinada tem um palestrante (plenária); ganha `speakers` resolvidos do pool e a `talk`
 *   { talks: [{start, end}, ...] }  → uma sessão de palestras por janela
 * `talkCatalog` (opcional, ver data/mock-talks.js) traz título, formato, tags
 * e palestrantes por trilha/posição; sem ele, tudo vira placeholder. `placeholderOptions` ({ rotateSpeakers: false }) vai para os placeholders das vagas vazias.
 */
function buildSchedule(plan, { eventTime, tracks, speakerPool, talkCatalog = null, placeholderOptions = {} }) {
  let talkIndex = 0;
  return plan.flatMap(item => {
    if (item.talks) {
      return item.talks.map(window => ({
        start: eventTime(window.start),
        end: eventTime(window.end),
        talks: talkCatalog ? catalogTalks(tracks, speakerPool, talkCatalog, talkIndex++, placeholderOptions) : placeholderTalks(tracks, speakerPool, talkIndex++, placeholderOptions),
      }));
    }
    const { start, end, keynote, ...banner } = item;
    return [{ start: eventTime(start), end: eventTime(end), ...banner, ...(keynote && { keynote: resolveKeynote(keynote, speakerPool) }) }];
  });
}
