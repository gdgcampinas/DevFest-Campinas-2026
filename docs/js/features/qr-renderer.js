/**
 * Desenha QR code com a biblioteca qrcodejs (a mesma do quadro da sala e do sorteio). `lib()` devolve o construtor (ou undefined se o CDN não
 * carregou): injetável, então o mural e os testes não dependem de global. O QR é desenhado em tamanho fixo e o CSS o estica pra caber na cena.
 */
function createQrRenderer({ lib = () => globalThis.QRCode, size = 512, colorDark = "#05060a", colorLight = "#ffffff" } = {}) {
  return {
    available: () => typeof lib() === "function",
    draw(mountEl, text) {
      const QR = lib();
      mountEl.innerHTML = "";
      return new QR(mountEl, { text, width: size, height: size, colorDark, colorLight });
    },
  };
}
