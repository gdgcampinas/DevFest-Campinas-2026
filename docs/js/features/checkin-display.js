/**
 * Feature: tela ao vivo pra deixar num tablet/monitor da sala. Mostra, por
 * trilha, os QR codes do momento e atualiza sozinha (nenhuma imagem pra
 * imprimir, roda o dia inteiro na mesma aba):
 *   - "Check-in nesta palestra": a palestra que está rolando agora;
 *   - "Avalie esta palestra": a última palestra terminada, e continua na tela
 *     até a próxima terminar (quem escaneia já faz o check-in junto);
 *   - "Avalie o evento": depois do fim do evento.
 *
 * Reusa resolveEventState() (live-status.js, mesmo cálculo do "AO VIVO" do
 * resto do site) e talkShareCode() (talk-index.js, o mesmo código curto do
 * `?agenda=`): nenhuma lógica de data/hora ou de código duplicada aqui.
 * `resolveRoomPanels` é pura (só decide o que mostrar), o resto só desenha.
 */
const checkinUrlFor = (code, siteUrl) => `${siteUrl}grade.html?checkin=${code}`;
const rateUrlFor = (code, siteUrl) => `${siteUrl}grade.html?avaliar=${code}`;
const rateEventUrl = siteUrl => `${siteUrl}index.html?avaliar=1`;

function resolveRoomPanels({ schedule, track, timezone, siteUrl, now }) {
  const state = resolveEventState(now, schedule);
  if (state.phase === "before") return { message: "O evento ainda não começou." };

  const talkSlots = schedule.filter(slot => slot.talks?.[track.id]);
  const finished = talkSlots.filter(slot => slot.end <= now).pop();
  const active = state.phase === "live" ? state.activeSlot : null;
  const panels = [];

  if (finished) {
    const code = talkShareCode(finished, track.id, timezone);
    panels.push({ id: "cdRate", kind: "rate", heading: active ? "Avalie a palestra anterior" : "Avalie esta palestra", title: finished.talks[track.id].title, hint: "Escaneie pra avaliar (seu check-in é registrado junto)", url: rateUrlFor(code, siteUrl) });
  }
  if (active?.talks?.[track.id]) {
    const code = talkShareCode(active, track.id, timezone);
    panels.push({ id: "cdCheckin", kind: "checkin", heading: "Check-in nesta palestra", title: active.talks[track.id].title, hint: "Aponte a câmera do celular pro QR code pra fazer check-in", url: checkinUrlFor(code, siteUrl) });
  }
  if (state.phase === "after") {
    panels.push({ id: "cdEvent", kind: "rate", heading: "Avalie o evento", title: "DevFest Campinas", hint: "Obrigado por participar! Conte como foi", url: rateEventUrl(siteUrl) });
  }
  return panels.length ? { panels } : { message: "Nenhuma palestra agora nesta sala." };
}

function initCheckinDisplay(rootEl, { schedule, track, timezone, siteUrl, now = () => new Date() }) {
  const bodyEl = rootEl.querySelector(".cd-body");
  let lastSignature = null;

  function draw({ panels, message }) {
    const signature = panels ? panels.map(panel => panel.url).join("|") : message;
    if (signature === lastSignature) return; // nada mudou desde o último tick: não redesenha (evita piscar o QR)
    lastSignature = signature;
    if (!panels) {
      bodyEl.innerHTML = `<div class="cd-empty">${message}</div>`;
      return;
    }
    bodyEl.innerHTML = `<div class="cd-track" style="--track-color:${track.color}">${track.label}</div>
      <div class="cd-panels${panels.length > 1 ? " cd-panels--multi" : ""}">${panels.map(roomPanelMarkup).join("")}</div>`;
    const size = panels.length > 1 ? 280 : 360;
    panels.forEach(panel => new QRCode(document.getElementById(panel.id), { text: panel.url, width: size, height: size, colorDark: "#05060a", colorLight: "#ffffff" }));
  }

  const tick = () => draw(resolveRoomPanels({ schedule, track, timezone, siteUrl, now: now() }));
  tick();
  setInterval(tick, 5000);
}
