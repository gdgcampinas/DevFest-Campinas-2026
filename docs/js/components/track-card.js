/**
 * Único template de "card de trilha" — usado na agenda completa e no
 * painel "acontecendo agora". Tudo por parâmetro, nada duplicado:
 *   reveal     → false esconde palestrante/título (mock "Em breve")
 *   live       → troca o chip de horário pela tag "AGORA" + barra de progresso
 *   startLabel → "HH:MM" do chip de horário (opcional)
 *   duration   → "40 min" no rodapé (opcional)
 *   talkKey    → chave de favorito; sem ela o card não mostra a estrela
 *   favorite   → estado inicial da estrela  |  progress → 0..1 da barra (só live)
 * Formato, tags, LinkedIn e "cargo · empresa" só aparecem se o dado tiver.
 *
 * Cor de trilha vem 100% de track.color (definido em schedule.js) e é
 * aplicada via --track-color inline — nenhum CSS aqui depende do id
 * da trilha, então funciona pra qualquer quantidade/nome de trilha.
 */
const HIDDEN_SPEAKER_LABEL = "Em breve";
const HIDDEN_TITLE_LABEL = "Título a confirmar";

/**
 * Normaliza speaker único ou `speakers: [{name, linkedin}]` (palestra
 * em dupla/painel). O atalho `speaker`/`linkedin` só carrega nome+link;
 * pra foto/empresa/cargo por palestrante, usar o formato array mesmo
 * com 1 pessoa só: `speakers: [{name, linkedin, photo, company, title}]`.
 */
function speakerList(data) {
  if (Array.isArray(data.speakers)) return data.speakers;
  if (!data.speaker) return [];
  return [{ name: data.speaker, linkedin: data.linkedin }];
}

function trackCardMarkup(track, data, {
  reveal = true, live = false, slotIndex = null,
  startLabel = "", duration = "", talkKey = "", favorite = false, progress = 0,
} = {}) {
  const speakers = reveal ? speakerList(data) : [];
  const speaker = reveal ? speakers.map((s) => s.name).join(" & ") || data.speaker : HIDDEN_SPEAKER_LABEL;
  const title = reveal && data.title ? data.title : "";
  const room = reveal ? track.room : "";
  const meta = reveal && speakers.length === 1 ? speakerMetaLine(speakers[0]) : "";

  // AGORA substitui o chip de horário; fora do ao-vivo o chip guarda o
  // rótulo original em data-label pra live-status trocar por "Em N min".
  const statusTag = live
    ? `<span class="now-tag"><span class="dot"></span>AGORA</span>`
    : startLabel ? `<span class="time-chip" data-label="${startLabel}">${startLabel}</span>` : "";

  const foot = [
    duration && `<span class="talk-duration">${iconMarkup("clock")}${duration}</span>`,
    talkKey && favoriteButtonMarkup({ key: talkKey, active: favorite }),
    room && `<span class="room-tag">${room}</span>`,
  ].filter(Boolean).join("");

  const attrs = [
    slotIndex !== null && `data-slot-index="${slotIndex}" tabindex="0" role="button"`,
    talkKey && `data-talk-key="${talkKey}"`,
  ].filter(Boolean).join(" ");

  return `
    <div class="talk${favorite ? " is-fav" : ""}" data-track="${track.id}" style="--track-color:${track.color}" ${attrs}>
      <div class="talk-top">
        <span class="track-label"><span class="dot" style="background:${track.color}"></span>${track.shortLabel ?? track.label}</span>
        ${statusTag}
      </div>
      <div class="title${title ? "" : " title--pending"}">${title || HIDDEN_TITLE_LABEL}</div>
      ${reveal ? talkTagsMarkup(data) : ""}
      <div class="talk-who">
        ${talkAvatarsMarkup(speakers)}
        <div class="talk-who-text">
          <div class="talk-name">${speaker}</div>
          ${meta ? `<div class="talk-meta">${meta}</div>` : ""}
        </div>
        ${reveal ? talkLinksMarkup(speakers) : ""}
      </div>
      ${foot ? `<div class="talk-foot">${foot}</div>` : ""}
      ${live ? `<div class="talk-progress"><b style="width:${Math.round(progress * 100)}%"></b></div>` : ""}
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

function talkDetailMarkup(track, data, { reveal = true, timeRange = "", room = "", talkKey = "", favorite = false } = {}) {
  const speakers = reveal ? speakerList(data) : [];
  const title = reveal ? data.title : "Palestra a confirmar";
  const description = reveal && data.description ? data.description : "";
  const roomLabel = reveal ? room : "";

  const metaItems = [
    timeRange && `<span>${timeRange}</span>`,
    roomLabel && `<span class="room-tag">${roomLabel}</span>`,
  ].filter(Boolean).join("");

  // avatar/company/title são opcionais no dado do speaker — palestra
  // sem eles renderiza igual ao formato original, sem linha/foto extra.
  const speakerLine = speakers.length
    ? `<div class="detail-speakers">${speakers.map((s) => {
        const nameEl = s.linkedin
          ? `<a class="detail-speaker" href="${s.linkedin}" target="_blank" rel="noopener">${s.name} <span class="li-icon">in</span></a>`
          : `<div class="detail-speaker">${s.name}</div>`;
        const meta = speakerMetaLine(s);
        const block = meta ? `<div class="detail-speaker-block">${nameEl}<div class="detail-speaker-meta">${meta}</div></div>` : nameEl;
        return `<div class="detail-speaker-row">${avatarMarkup(s.name, s.photo, "detail-avatar")}${block}</div>`;
      }).join("")}</div>`
    : `<div class="detail-speaker">${HIDDEN_SPEAKER_LABEL}</div>`;

  return `
    <div class="detail" data-track="${track.id}" style="--track-color:${track.color}">
      <div class="detail-top">
        <span class="track-label"><span class="dot" style="background:${track.color}"></span>${track.label}</span>
        ${talkKey ? favoriteButtonMarkup({ key: talkKey, active: favorite }) : ""}
      </div>
      <h3 class="detail-title">${title}</h3>
      ${reveal ? talkTagsMarkup(data) : ""}
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
