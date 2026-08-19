/**
 * Único template de "card de trilha" — usado na agenda completa e no
 * painel "acontecendo agora". Tudo por parâmetro, nada duplicado:
 *   reveal    → false esconde palestrante/título (mock "Em breve")
 *   live      → adiciona a tag "AGORA" pulsante
 *   timeRange → texto "HH:MM — HH:MM" pro rodapé do card (opcional)
 *
 * Cor de trilha vem 100% de track.color (definido em schedule.js) e é
 * aplicada via --track-color inline — nenhum CSS aqui depende do id
 * da trilha, então funciona pra qualquer quantidade/nome de trilha.
 */
const HIDDEN_SPEAKER_LABEL = "Em breve";

/** Normaliza speaker único ou `speakers: [{name, linkedin}]` (palestra em dupla/painel). */
function speakerList(data) {
  if (Array.isArray(data.speakers)) return data.speakers;
  if (!data.speaker) return [];
  return [{ name: data.speaker, linkedin: data.linkedin }];
}

function trackCardMarkup(track, data, { reveal = true, live = false, timeRange = "", slotIndex = null } = {}) {
  const speaker = reveal ? speakerList(data).map((s) => s.name).join(" & ") || data.speaker : HIDDEN_SPEAKER_LABEL;
  const title = reveal ? data.title : "";
  const room = reveal ? track.room : "";

  const nowTag = live
    ? `<span class="now-tag"><span class="dot"></span>AGORA</span>`
    : "";

  const footItems = [timeRange, room].filter(Boolean);
  const foot = footItems.length
    ? `<div class="foot">${footItems.map((item, i) => i === footItems.length - 1 && room
        ? `<span class="room-tag">${item}</span>`
        : `<span class="time">${item}</span>`).join("")}</div>`
    : "";

  const clickable = slotIndex !== null ? ` data-slot-index="${slotIndex}" tabindex="0" role="button"` : "";

  return `
    <div class="talk" data-track="${track.id}" style="--track-color:${track.color}"${clickable}>
      <div class="track-row">
        <span class="track-label"><span class="dot" style="background:${track.color}"></span>${track.label}</span>
        ${nowTag}
      </div>
      ${title ? `<div class="title">${title}</div>` : ""}
      <div class="speaker">${speaker}</div>
      ${foot}
    </div>`;
}

/**
 * Conteúdo do modal de detalhe — mesma trilha/dados do card, formato
 * maior com descrição completa. reveal segue a mesma regra do card.
 */
/** "Cargo · Empresa" — só aparece se pelo menos um dos dois vier preenchido no speaker. */
function speakerMetaLine(speaker) {
  return [speaker.title, speaker.company].filter(Boolean).join(" · ");
}

function talkDetailMarkup(track, data, { reveal = true, timeRange = "", room = "" } = {}) {
  const speakers = reveal ? speakerList(data) : [];
  const title = reveal ? data.title : "Palestra a confirmar";
  const description = reveal && data.description ? data.description : "";
  const roomLabel = reveal ? room : "";

  const metaItems = [
    timeRange && `<span>${timeRange}</span>`,
    roomLabel && `<span class="room-tag">${roomLabel}</span>`,
  ].filter(Boolean).join("");

  // company/title são opcionais no dado do speaker — palestra sem eles
  // renderiza igual ao formato original, sem linha extra.
  const speakerLine = speakers.length
    ? `<div class="detail-speakers">${speakers.map((s) => {
        const nameEl = s.linkedin
          ? `<a class="detail-speaker" href="${s.linkedin}" target="_blank" rel="noopener">${s.name} <span class="li-icon">in</span></a>`
          : `<div class="detail-speaker">${s.name}</div>`;
        const meta = speakerMetaLine(s);
        return meta ? `<div class="detail-speaker-block">${nameEl}<div class="detail-speaker-meta">${meta}</div></div>` : nameEl;
      }).join("")}</div>`
    : `<div class="detail-speaker">${HIDDEN_SPEAKER_LABEL}</div>`;

  return `
    <div class="detail" data-track="${track.id}" style="--track-color:${track.color}">
      <span class="track-label"><span class="dot" style="background:${track.color}"></span>${track.label}</span>
      <h3 class="detail-title">${title}</h3>
      ${description ? `<p class="detail-desc">${description}</p>` : ""}
      ${metaItems ? `<div class="detail-meta">${metaItems}</div>` : ""}
      ${speakerLine}
    </div>`;
}

/**
 * Sessão combinada (credenciamento, pausa, encerramento) — mesmo bloco
 * usado na agenda completa e no hero "ao vivo agora".
 */
function bannerMarkup(slot) {
  return `<div class="banner"><div class="t">${slot.banner}</div>${slot.room ? `<div class="r">${slot.room}</div>` : ""}</div>`;
}
