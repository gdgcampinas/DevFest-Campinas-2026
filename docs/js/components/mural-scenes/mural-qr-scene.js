/**
 * Cena de QR gigante (avaliar o evento, cartão "Eu vou!"): título e dica por dado, QR desenhado por `qr` (features/qr-renderer.js) pra ler de longe.
 * Sem a biblioteca de QR (CDN fora do ar, sem internet) a cena falha na preparação e descansa: um QR que não aparece não serve de nada.
 * O endereço é `siteUrl + params.path + extraQuery()`; `extraQuery` leva o ensaio (?ensaio=...) pros outros aparelhos entrarem no mesmo teste.
 */
function createQrScene({ siteUrl, extraQuery = () => "", qr }) {
  return {
    prepare() {
      if (!qr.available()) throw new Error("biblioteca de QR indisponível");
    },
    render(_prepared, params) {
      const url = `${siteUrl}${params.path}${extraQuery()}`;
      return {
        markup: `<section class="ms ms-qr"><div class="ms-qr-text">${muralHeadMarkup({ kicker: params.kicker, title: params.heading })}<p class="ms-hint">${escapeHtml(params.hint)}</p><p class="ms-url">${escapeHtml(`${siteUrl}${params.path}`.replace(/^https?:\/\//, ""))}</p></div><div class="ms-qr-code" data-qr></div></section>`,
        mount: el => qr.draw(el.querySelector("[data-qr]"), url),
      };
    },
  };
}
