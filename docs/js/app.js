/**
 * Bootstrap: liga os módulos (header, agenda, filtro, status ao vivo,
 * antes-de-vir, patrocinadores) aos dados definidos em
 * schedule.js/schedule.dev.js e sponsors.js. Trocar de evento ou de
 * sala/MC/patrocinador = trocar só os arquivos de dados, nada aqui.
 */

/**
 * Overrides de URL pra testar em DEV sem tocar em schedule.js (PROD real):
 *   ?demo=2026-11-14T09:50     → simula a hora do evento (ativa "ao vivo agora")
 *   ?demo=2026-11-14T09:50:30  → segundos são opcionais
 *   ?lineup=1                   → força mostrar palestrante/título mesmo com
 *                                 EVENT.lineupRevealed=false
 */
function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/** null se `demo` não veio na URL ou não é uma data válida. */
function parseDemoDate(demo) {
  if (!demo) return null;
  const withSeconds = /T\d{2}:\d{2}:\d{2}/.test(demo) ? demo : `${demo}:00`;
  const date = new Date(`${withSeconds}${EVENT.utcOffset}`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * O relógio simulado continua avançando normalmente a partir do
 * instante em ?demo= — fixa um offset em vez de congelar num ponto só,
 * pra dar pra assistir uma troca de sessão acontecer ao vivo de verdade.
 */
function resolveNow() {
  const demoStart = parseDemoDate(getParam("demo"));
  if (!demoStart) return () => new Date();
  const offsetMs = demoStart.getTime() - Date.now();
  return () => new Date(Date.now() + offsetMs);
}

function resolveReveal() {
  return getParam("lineup") === "1" ? true : EVENT.lineupRevealed;
}

function warnIfDemoMode() {
  const demo = getParam("demo");
  if (!demo) return;
  const valid = parseDemoDate(demo) !== null;
  const banner = document.createElement("div");
  banner.textContent = valid
    ? "⚠️ MODO TESTE — data simulada, não é o horário real do evento"
    : `⚠️ ?demo="${demo}" inválido — mostrando horário real. Formato: AAAA-MM-DDTHH:MM`;
  banner.style.cssText = "background:#ea4335;color:#fff;text-align:center;font-size:.75rem;font-weight:700;padding:6px;position:sticky;top:0;z-index:100";
  document.body.prepend(banner);
}

/** Único lugar que sabe montar URLs do Google Maps a partir de um endereço. */
function googleMapsUrls(address) {
  const q = encodeURIComponent(address);
  return {
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    embed: `https://www.google.com/maps?q=${q}&output=embed`,
  };
}

/** yyyymmddThhmmssZ — formato exigido pelo link de adicionar ao Google Calendar. */
function toGCalStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function googleCalendarUrl(event, schedule) {
  const start = schedule[0].start;
  const end = schedule[schedule.length - 1].end;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${toGCalStamp(start)}/${toGCalStamp(end)}`,
    location: `${event.venue}, ${event.address}`,
    details: `Agenda ao vivo: ${location.href}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * Header do organizador — funciona com 1 ou N coanfitriões/patrocinadores
 * (EVENT.hosts), sem "+" fixo em HTML: o separador é gerado entre cada
 * logo automaticamente.
 */
function renderBrand(hosts, mountEl) {
  mountEl.innerHTML = hosts
    .map((host, i) => `${i > 0 ? `<span class="brand-plus">+</span>` : ""}<img class="brand-icon" src="${host.icon}" alt="${host.name}"><span>${host.name}</span>`)
    .join("");
}

/** Wordmark é texto, não imagem — trocar de evento não exige gerar novo asset. */
function renderWordmark(event, mountEl) {
  mountEl.textContent = `${event.name} ${event.date.slice(0, 4)}`;
}

function renderHeaderMeta(event, schedule, mountEl) {
  const start = hourLabel(schedule[0].start, event.timezone);
  const end = hourLabel(schedule[schedule.length - 1].end, event.timezone);
  const dateLabel = schedule[0].start.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: event.timezone });
  const { directions } = googleMapsUrls(event.address);
  mountEl.innerHTML = `
    <span class="when">${dateLabel}</span>
    <span class="sep">·</span>
    <span class="when">das ${start} às ${end}</span>
    <span class="sep">·</span>
    <a class="venue-link" href="${directions}" target="_blank" rel="noopener">${event.venue} · como chegar</a>`;
}

function renderVenueInfo(event, mountEl, schedule) {
  const { directions } = googleMapsUrls(event.address);
  const gcal = googleCalendarUrl(event, schedule);
  mountEl.innerHTML = `
    <p class="venue-addr">${event.venue}<br>${event.address}</p>
    <div class="venue-actions">
      <a class="go go-primary" href="${directions}" target="_blank" rel="noopener">Como chegar</a>
      <a class="go go-cal" href="${gcal}" target="_blank" rel="noopener">+ Calendário</a>
    </div>`;
}

function renderVenueMap(event, mountEl) {
  // mapa externo (endereço/entrada) pode; planta interna do prédio, não.
  const { embed } = googleMapsUrls(event.address);
  mountEl.innerHTML = `
    <div class="label">Local</div>
    <div class="frame"><iframe src="${embed}" loading="lazy" title="Mapa até ${event.venue}"></iframe></div>`;
}

/**
 * Imagens das galerias de "Antes de vir" — vazio até termos
 * confirmação de food truck(s)/estacionamento. Card correspondente
 * simplesmente não fica clicável enquanto a lista estiver vazia (ver
 * buildBeforeYouComeItems abaixo), sem precisar mexer em HTML/CSS.
 */
const PARKING_IMAGES = [
  // { file: "assets/img/parking-map.jpg", alt: "Mapa do estacionamento" },
];
const FOOD_IMAGES = [
  // { file: "assets/img/menu-x.jpg", alt: "Cardápio X" },
];

const ICON_PARKING = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M3 11h18"></path><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path><path d="M9 15h3a1.5 1.5 0 0 0 0-3H9v6"></path></svg>`;
const ICON_FOOD = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a9 5 0 0 1 18 0z"></path><path d="M3 11h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M7 20h10"></path></svg>`;
const ICON_VENUE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

/**
 * Monta os 3 cards de "Antes de vir" reaproveitando as N primeiras
 * cores de trilha só como acento visual (sem relação temática) — se o
 * número de trilhas mudar, os cards continuam funcionando sem editar
 * nada aqui.
 */
function buildBeforeYouComeItems(tracks) {
  const [trackA, trackB, trackC] = tracks;
  const fallback = "var(--muted)";
  return [
    {
      id: "parking",
      trackColor: trackA?.color ?? fallback,
      icon: ICON_PARKING,
      title: "Estacionamento",
      body: "Informações do estacionamento em breve.",
      clickable: PARKING_IMAGES.length > 0,
      linkText: PARKING_IMAGES.length > 0 ? "Ver estacionamento" : "",
    },
    {
      id: "food",
      trackColor: trackB?.color ?? fallback,
      icon: ICON_FOOD,
      title: "Comida",
      body: "Opções de alimentação em breve.",
      clickable: FOOD_IMAGES.length > 0,
      linkText: FOOD_IMAGES.length > 0 ? "Ver cardápio" : "",
    },
    {
      id: "venue",
      trackColor: trackC?.color ?? fallback,
      icon: ICON_VENUE,
      title: "Local",
      mountId: "venueInfo",
    },
  ];
}

function initApp() {
  warnIfDemoMode();
  const reveal = resolveReveal();

  renderBrand(EVENT.hosts, document.getElementById("brand"));
  renderWordmark(EVENT, document.getElementById("wordmark"));
  renderHeaderMeta(EVENT, SCHEDULE, document.getElementById("headerMeta"));

  document.documentElement.style.setProperty("--track-count", TRACKS.length);
  const tabsEl = document.querySelector(".tabs");
  const agendaEl = document.getElementById("agenda");
  renderLegend(TRACKS, document.querySelector(".tracks-legend"));
  renderTabs(TRACKS, tabsEl);
  renderAgenda(SCHEDULE, TRACKS, EVENT.timezone, agendaEl, { reveal });
  initTrackFilter(tabsEl, agendaEl);

  initStickyStatus(document.getElementById("hero"), document.getElementById("stickyStatus"));

  const modal = createTalkModal(document.getElementById("talkModal"), document.getElementById("talkModalContent"));
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal });

  renderInfoCards(buildBeforeYouComeItems(TRACKS), document.getElementById("beforeYouCome"));
  renderVenueInfo(EVENT, document.getElementById("venueInfo"), SCHEDULE);
  renderVenueMap(EVENT, document.getElementById("venueMap"));
  initClickableCard(document.querySelector('[data-item="parking"]'), modal, () =>
    galleryMarkup("Estacionamento", "Informações em breve.", PARKING_IMAGES));
  initClickableCard(document.querySelector('[data-item="food"]'), modal, () =>
    galleryMarkup("Cardápio", "Informações em breve.", FOOD_IMAGES));
  initMenuCarousel(document.getElementById("talkModal"));

  renderSponsors(SPONSORS, document.getElementById("sponsorsSection"), document.querySelector(".sponsors-grid"));

  const liveStatus = createLiveStatus({
    schedule: SCHEDULE,
    tracks: TRACKS,
    event: EVENT,
    reveal,
    elements: {
      statusPill: document.getElementById("statusPill"),
      hero: document.getElementById("hero"),
      stickyTxt: document.getElementById("stickyTxt"),
      stickyPulse: document.getElementById("stickyPulse"),
    },
    now: resolveNow(),
  });

  liveStatus.tick();
  setInterval(liveStatus.tick, 1000);
}

// carregado depois que o DOM já está pronto (script no fim do body) — roda direto.
initApp();
