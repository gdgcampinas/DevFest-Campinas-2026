/**
 * Cena de QR gigante (avaliar o evento, "Mande sua foto"): título e dica por dado, QR desenhado por `qr` (features/qr-renderer.js) pra ler de longe.
 * Pra onde o QR leva vem de `targets` (features/qr-targets.js, injetado): uma página do site ou o convite do álbum colaborativo. Sem destino (intermediário desligado) a cena não aparece.
 * Sem a biblioteca de QR (CDN fora do ar, sem internet) a cena falha na preparação e descansa: um QR que não aparece não serve de nada.
 */
function createQrScene({ targets, qr }) {
  return {
    prepare(params) {
      if (!qr.available()) throw new Error("biblioteca de QR indisponível");
      return targets.resolve(params) ?? MURAL_SKIP;
    },
    render(target, params) {
      const label = target.label ? `<p class="ms-url">${escapeHtml(target.label)}</p>` : "";
      return {
        markup: `<section class="ms ms-qr"><div class="ms-qr-text">${muralHeadMarkup({ kicker: params.kicker, title: params.heading })}<p class="ms-hint">${escapeHtml(params.hint)}</p>${label}</div><div class="ms-qr-code" data-qr></div></section>`,
        mount: el => { qr.draw(el.querySelector("[data-qr]"), target.url); },
      };
    },
  };
}
