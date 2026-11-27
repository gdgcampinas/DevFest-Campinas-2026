/** Uma trilha na legenda em linhas: barra na cor, nome grande, mestre de cerimônia menor e a sala num bloco colorido (no celular ela desce). `config` = data/track-legend.js; sem MC ou sem sala, a parte some. */
function trackLegendRowMarkup(track, { mcLabel, mcPrefix }) {
  const name = track.mc?.replace(mcPrefix, "");
  const mc = track.mc ? `<span class="tl-mc">${iconMarkup("mic")}<span>${escapeHtml(name === track.mc ? track.mc : `${mcLabel} ${name}`)}</span></span>` : "";
  const room = track.room ? `<div class="tl-room">${iconMarkup("pin")}<span>${escapeHtml(track.room)}</span></div>` : "";
  return `<div class="item tl-row" data-track="${track.id}" style="--track-color:${track.color}">
    <span class="tl-bar"></span>
    <div class="tl-main"><strong class="tl-name">${escapeHtml(track.label)}</strong>${mc}</div>${room}
  </div>`;
}
