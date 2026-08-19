/**
 * Feature: estado ao vivo do evento — pill do header, hero (3 estados),
 * destaque na agenda (ativo/passado) e barra fixa ao rolar.
 *
 * Separado em duas camadas, sem duplicar lógica de data/hora:
 *   resolveEventState() → só calcula o estado a partir de now/schedule
 *   createLiveStatus()  → só renderiza, consumindo o estado já resolvido
 */
function pad(n) {
  return String(n).padStart(2, "0");
}

function countdownParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

function formatHMS(ms) {
  const { hours, mins, secs } = countdownParts(ms);
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function formatMS(ms) {
  const { mins, secs } = countdownParts(ms);
  return `${pad(mins)}:${pad(secs)}`;
}

function formatDaysHMS(ms) {
  const { days, hours, mins, secs } = countdownParts(ms);
  return days > 0 ? `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function initStickyStatus(sectionEl, stickyEl) {
  new IntersectionObserver(
    ([entry]) => stickyEl.classList.toggle("show", !entry.isIntersecting),
    { threshold: 0 }
  ).observe(sectionEl);
}

/** Só calcula o estado — nenhum acesso ao DOM aqui. */
function resolveEventState(now, schedule) {
  const first = schedule[0].start;
  const last = schedule[schedule.length - 1].end;

  if (now < first) return { phase: "before", first };
  if (now >= last) return { phase: "after" };

  const activeIndex = schedule.findIndex(s => now >= s.start && now < s.end);
  if (activeIndex >= 0) {
    return { phase: "live", activeIndex, activeSlot: schedule[activeIndex] };
  }
  const nextIndex = schedule.findIndex(s => now < s.start);
  return { phase: "live", activeIndex: -1, nextSlot: nextIndex >= 0 ? schedule[nextIndex] : null };
}

function createLiveStatus({ schedule, tracks, event, elements, now = () => new Date(), reveal = true }) {
  const { statusPill, hero, stickyTxt, stickyPulse } = elements;

  // dot fica num nó fixo, criado uma vez só — só o texto é trocado a
  // cada tick, então a animação de pulso nunca reinicia sozinha.
  function renderStatusPill(state) {
    if (!statusPill.querySelector(".txt")) {
      statusPill.innerHTML = `<span class="dot"></span><span class="txt"></span>`;
    }
    statusPill.classList.toggle("live", state.phase === "live");
    const txt = statusPill.querySelector(".txt");
    if (state.phase === "before") txt.textContent = `Começa em ${formatDaysHMS(state.first - now())}`;
    else if (state.phase === "live") txt.textContent = "AO VIVO";
    else txt.textContent = "Encerrado";
  }

  function renderHeroBefore(state) {
    hero.innerHTML = `
      <div class="hero-card hero-before">
        <div class="hero-label">O EVENTO COMEÇA EM</div>
        <div class="countdown" id="heroCountdown">${formatDaysHMS(state.first - now())}</div>
        <div class="hero-before-row">
          <span class="pill-amber">Inscrições encerradas</span>
          <span class="hero-hint">Programação abaixo em modo prévia</span>
        </div>
      </div>`;
    stickyPulse.style.display = "none";
    stickyTxt.textContent = `Começa em ${formatDaysHMS(state.first - now())}`;
  }

  function renderHeroAfter() {
    hero.innerHTML = `
      <div class="hero-card hero-after">
        <div class="title">Obrigado por participar! 🎉</div>
        <div class="sub">O ${event.name} ${new Date().getFullYear()} foi encerrado. Fotos e conteúdos em breve pelo GDG Campinas.</div>
      </div>`;
    stickyPulse.style.display = "none";
    stickyTxt.textContent = "Encerrado";
  }

  function renderHeroLive(state) {
    const slot = state.activeSlot;

    if (!slot) {
      const next = state.nextSlot;
      hero.innerHTML = `
        <div class="hero-card live">
          <div class="hero-label"><span class="dot"></span>ACONTECENDO AGORA</div>
          <div class="hero-hint">Intervalo entre sessões${next ? ` — próximo bloco às ${formatEventTime(next.start, event.timezone)}` : ""}</div>
        </div>`;
      stickyTxt.textContent = next ? `Intervalo — próximo bloco às ${formatEventTime(next.start, event.timezone)}` : "Intervalo";
      stickyPulse.style.display = "inline-block";
      return;
    }

    const nextChange = `<span class="next-change" id="nextChangeText">próxima troca em ${formatMS(slot.end - now())}</span>`;

    if (slot.banner) {
      hero.innerHTML = `
        <div class="hero-card live">
          <div class="hero-live-top">
            <div class="hero-label"><span class="dot"></span>ACONTECENDO AGORA</div>
            ${nextChange}
          </div>
          ${bannerMarkup(slot)}
        </div>`;
      stickyTxt.textContent = slot.banner;
    } else {
      const cards = tracks.map(track => trackCardMarkup(track, slot.talks[track.id], { reveal, live: true, slotIndex: state.activeIndex })).join("");
      hero.innerHTML = `
        <div class="hero-card live">
          <div class="hero-live-top">
            <div class="hero-label"><span class="dot"></span>ACONTECENDO AGORA</div>
            ${nextChange}
          </div>
          <div class="talks" data-view="all">${cards}</div>
        </div>`;
      stickyTxt.textContent = reveal
        ? `Agora: ${tracks.map(track => slot.talks[track.id].speaker).join(" · ")}`
        : "Agora: confira sua trilha";
    }
    stickyPulse.style.display = "inline-block";
  }

  /**
   * Chamado quando o estado (fase/sessão ativa) NÃO mudou desde o
   * último tick — só atualiza os números do contador via texto direto,
   * sem tocar no resto do DOM. Evita recriar os cards clicáveis do
   * hero a cada segundo (arriscava perder toque em mobile: se o dedo
   * tocar bem no instante do innerHTML ser trocado, o clique pode
   * simplesmente não disparar).
   */
  function patchCountdowns(state) {
    if (state.phase === "before") {
      const el = document.getElementById("heroCountdown");
      if (el) el.textContent = formatDaysHMS(state.first - now());
      stickyTxt.textContent = `Começa em ${formatDaysHMS(state.first - now())}`;
    } else if (state.phase === "live" && state.activeSlot) {
      const el = document.getElementById("nextChangeText");
      if (el) el.textContent = `próxima troca em ${formatMS(state.activeSlot.end - now())}`;
    }
  }

  function markAgendaSlots(state) {
    const currentTime = now();
    document.querySelectorAll(".slot").forEach((el, index) => {
      const slot = schedule[index];
      el.classList.toggle("active", state.phase === "live" && index === state.activeIndex);
      el.classList.toggle("past", slot.end <= currentTime);
    });
  }

  let renderedKey = null;

  function tick() {
    const state = resolveEventState(now(), schedule);
    renderStatusPill(state);
    markAgendaSlots(state);

    const key = state.phase === "live" ? `live:${state.activeIndex}` : state.phase;
    if (key === renderedKey) {
      patchCountdowns(state);
      return;
    }
    renderedKey = key;

    if (state.phase === "before") renderHeroBefore(state);
    else if (state.phase === "after") renderHeroAfter();
    else renderHeroLive(state);
  }

  return { tick };
}
