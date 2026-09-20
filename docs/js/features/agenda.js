/**
 * Feature: agenda completa + legenda (o filtro por trilha vive em track-filter.js).
 * Tudo injetado por parâmetro (schedule, tracks) — nada hardcoded aqui,
 * então essa mesma função serve pra qualquer lista de trilhas/horários.
 */
function formatEventTime(date, timezone) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: timezone });
}

/** "08h" — padrão usado nas outras comunicações do evento (sem minutos). */
function hourLabel(date, timezone) {
  const hour = date.toLocaleTimeString("pt-BR", { hour: "2-digit", timeZone: timezone, hour12: false });
  return `${hour}h`;
}

/** "40 min" — duração do slot, calculada do próprio horário (nada hardcoded). */
function durationLabel(slot) {
  return `${Math.round((slot.end - slot.start) / 60000)} min`;
}

function timeRangeLabel(slot, timezone) {
  return `${formatEventTime(slot.start, timezone)} — ${formatEventTime(slot.end, timezone)}`;
}

/** "28 de novembro de 2026" — usado no header e no ticker (app.js/ticker.js), 1 lugar só. */
function eventDateLabel(schedule, timezone) {
  return schedule[0].start.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: timezone });
}

/**
 * Opções de card de palestra derivadas do slot — 1 lugar só, usado pela
 * agenda completa e pelo "ao vivo agora" (live-status.js).
 * `favorites` é opcional: sem ele o card não mostra a estrela.
 */
function talkCardOptions(slot, index, track, timezone, { reveal = true, favorites = null, live = false, progress = 0 } = {}) {
  const key = talkKey(slot, track.id);
  return {
    reveal,
    live,
    progress,
    slotIndex: index,
    startLabel: formatEventTime(slot.start, timezone),
    duration: durationLabel(slot),
    talkKey: favorites ? key : "",
    favorite: favorites ? favorites.has(key) : false,
  };
}

function renderLegend(tracks, mountEl) {
  mountEl.innerHTML = tracks
    .map(track => {
      const mc = track.mc ? `<span class="mc">${track.mc}</span>` : "";
      const room = track.room ? `<span class="room-tag">${track.room}</span>` : "";
      const sub = [mc, room].filter(Boolean).join(" · ");
      return `
        <div class="item" data-track="${track.id}" style="--track-color:${track.color}">
          <span class="name"><span class="dot" style="background:${track.color}"></span>${track.label}</span>
          ${sub ? `<span class="sub">${sub}</span>` : ""}
        </div>`;
    })
    .join("");
}

function renderAgenda(schedule, tracks, timezone, mountEl, { reveal = true, favorites = null } = {}) {
  mountEl.innerHTML = schedule
    .map((slot, index) => {
      const time = formatEventTime(slot.start, timezone);
      const body = slot.banner
        ? bannerMarkup(slot)
        : `<div class="talks" data-view="all">${tracks.map(track => trackCardMarkup(track, slot.talks[track.id], talkCardOptions(slot, index, track, timezone, { reveal, favorites }))).join("")}</div>`;
      return `<div class="slot" data-index="${index}"><div class="slot-time">${time}</div>${body}</div>`;
    })
    .join("");
}
