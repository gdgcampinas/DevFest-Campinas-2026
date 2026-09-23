/**
 * Um painel da tela da sala (checkin-display.html): rótulo, título da
 * palestra ou do evento, QR (features/checkin-display.js desenha o QR em
 * `#<id>`) e a dica. Puro template. `kind` só troca a cor do rótulo
 * ("checkin" usa a cor da trilha, "rate" usa o destaque do site).
 */
function roomPanelMarkup({ id, kind, heading, title, hint }) {
  return `<section class="cd-panel cd-panel--${kind}">
    <div class="cd-kind">${heading}</div>
    <h1 class="cd-title">${title}</h1>
    <div class="cd-qr" id="${id}"></div>
    <p class="cd-hint">${hint}</p>
  </section>`;
}
