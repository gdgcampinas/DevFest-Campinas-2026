/**
 * Põe um <video> pra tocar no telão e devolve a função que cancela as tentativas pendentes. Reusada pela cena "vídeo" e pelo fundo animado (mural-backdrop.js), então a regra é uma só:
 *  - o navegador pausa o vídeo "pra economizar energia" (janela escondida ou coberta, AbortError): tenta de novo a cada `retryMs`, até `retries` vezes, em vez de derrubar a cena;
 *  - se pediu som e o navegador bloqueou (NotAllowedError, política de autoplay), segue MUDO em vez de ficar parado (o comando do quiosque libera: --autoplay-policy=no-user-gesture-required);
 *  - qualquer outra falha chama `fail(motivo)`.
 * `deps.schedule` (do motor) agenda as novas tentativas; sem ele não há nova tentativa (teste).
 */
function muralPlayVideo(video, { sound = false, deps = {}, retries = 20, retryMs = 500, fail = () => {} } = {}) {
  const play = () => Promise.resolve(video.play()); // navegador sem promessa (ou teste) também vale
  let cancelRetry = () => {};
  const start = (attempt = 0) => play().catch(async error => {
    if (error?.name === "AbortError" && deps.schedule && attempt < retries) {
      cancelRetry = deps.schedule(() => start(attempt + 1), retryMs);
      return;
    }
    if (!sound || error?.name !== "NotAllowedError") return fail(error?.message ?? "não tocou");
    video.muted = true;
    await play().catch(second => fail(second?.message ?? "não tocou"));
  });
  start();
  return () => cancelRetry();
}

/** Solta o vídeo ao sair da cena (libera o decodificador). */
function muralReleaseVideo(video) {
  video.pause();
  video.removeAttribute("src");
  video.load();
}
