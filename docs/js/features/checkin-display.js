/**
 * Feature: tela de check-in ao vivo pra deixar num tablet/monitor da
 * sala. Mostra o QR da palestra que está rolando agora naquela trilha
 * e atualiza sozinha quando a palestra muda — nenhuma imagem pra
 * imprimir, roda o dia inteiro na mesma aba.
 *
 * Reusa resolveEventState() (live-status.js, mesmo cálculo do "AO VIVO"
 * do resto do site) e talkShareCode() (talk-index.js, o mesmo código
 * curto usado em `?agenda=`) — zero lógica de data/hora ou de código
 * duplicada aqui, só o desenho da tela.
 */
function checkinUrlFor(entry, siteUrl) {
  return `${siteUrl}grade.html?checkin=${entry.code}`;
}

function initCheckinDisplay(rootEl, { schedule, track, timezone, siteUrl, now = () => new Date() }) {
  const bodyEl = rootEl.querySelector(".cd-body");
  let qr = null;
  let lastCode = null;

  function renderNoTalk(message) {
    lastCode = null;
    if (qr) { bodyEl.innerHTML = ""; qr = null; }
    bodyEl.innerHTML = `<div class="cd-empty">${message}</div>`;
  }

  function renderTalk(slot) {
    const data = slot.talks[track.id];
    const code = talkShareCode(slot, track.id, timezone);
    const url = checkinUrlFor({ code }, siteUrl);

    if (code === lastCode) return; // mesma palestra do último tick, não redesenha (evita piscar o QR)
    lastCode = code;

    bodyEl.innerHTML = `
      <div class="cd-track" style="--track-color:${track.color}">${track.label}</div>
      <h1 class="cd-title">${data.title}</h1>
      <div class="cd-qr" id="cdQr"></div>
      <p class="cd-hint">Aponte a câmera do celular pro QR code<br>pra fazer check-in nesta palestra</p>
    `;
    qr = new QRCode(document.getElementById("cdQr"), { text: url, width: 360, height: 360, colorDark: "#05060a", colorLight: "#ffffff" });
  }

  function tick() {
    const state = resolveEventState(now(), schedule);
    if (state.phase === "before") return renderNoTalk("O evento ainda não começou.");
    if (state.phase === "after") return renderNoTalk("Obrigado por participar! Até a próxima edição.");
    const slot = state.activeSlot;
    if (!slot || !slot.talks || !slot.talks[track.id]) return renderNoTalk("Nenhuma palestra agora nesta sala.");
    renderTalk(slot);
  }

  tick();
  setInterval(tick, 5000);
}
