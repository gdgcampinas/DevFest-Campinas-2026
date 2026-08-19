/**
 * Feature: agenda completa + legenda + abas de filtro por trilha.
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

function timeRangeLabel(slot, timezone) {
  return `${formatEventTime(slot.start, timezone)} — ${formatEventTime(slot.end, timezone)}`;
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

function renderTabs(tracks, mountEl) {
  const allTab = `<button class="tab active" data-track="all">Todas as trilhas</button>`;
  const trackTabs = tracks
    .map(track => `<button class="tab" data-track="${track.id}" style="--track-color:${track.color}">${track.shortLabel}</button>`)
    .join("");
  mountEl.innerHTML = allTab + trackTabs;
}

function renderAgenda(schedule, tracks, timezone, mountEl, { reveal = true } = {}) {
  mountEl.innerHTML = schedule
    .map((slot, index) => {
      const time = formatEventTime(slot.start, timezone);
      const body = slot.banner
        ? bannerMarkup(slot)
        : `<div class="talks" data-view="all">${tracks.map(track => trackCardMarkup(track, slot.talks[track.id], { reveal, timeRange: timeRangeLabel(slot, timezone), slotIndex: index })).join("")}</div>`;
      return `<div class="slot" data-index="${index}"><div class="slot-time">${time}</div>${body}</div>`;
    })
    .join("");
}

/**
 * scopeEl delimita onde o filtro atua — só a agenda completa, nunca o
 * card "acontecendo agora" do hero (mesmo que reaproveite .talks/.talk).
 */
function initTrackFilter(tabsEl, scopeEl) {
  tabsEl.addEventListener("click", event => {
    const btn = event.target.closest(".tab");
    if (!btn) return;

    tabsEl.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const track = btn.dataset.track;
    scopeEl.querySelectorAll(".talks").forEach(t => (t.dataset.view = track));
    scopeEl.querySelectorAll(".talk").forEach(card => {
      card.classList.toggle("shown", track === "all" || card.dataset.track === track);
    });
  });
}
