/**
 * Repository da PÁGINA do álbum no Google Fotos (a "API" de onde vêm os dados). Só sabe buscar o HTML de um link de compartilhamento; quem interpreta é o parse-album.mjs.
 * Dois passos, porque o Google trata o link curto (photos.app.goo.gl) conforme o navegador que pede: com um User-Agent SIMPLES devolve um redirecionamento (302) pro endereço
 * completo do álbum, com um de navegador devolve uma página de passagem sem as fotos. Então: (1) resolve o link curto com o agente simples e (2) busca a página completa com o de navegador.
 * `fetchFn` é injetado (fetch do Node ou do Worker; nos testes, um de mentira). Só aceita os endereços do Google Fotos, pra o registro de álbuns nunca virar um
 * jeito de fazer o servidor buscar qualquer site.
 */
const SHORT_HOST = "photos.app.goo.gl";
const SHARE_HOST = "photos.google.com";
const SIMPLE_USER_AGENT = "Mozilla/5.0";
const BROWSER_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function assertGooglePhotos(url) {
  if (url.protocol !== "https:" || ![SHORT_HOST, SHARE_HOST].includes(url.hostname)) throw new Error(`endereço fora do Google Fotos: ${url.hostname}`);
  return url;
}

export function createGooglePhotosRepository({ fetchFn = globalThis.fetch, userAgent = BROWSER_USER_AGENT } = {}) {
  async function resolveShareUrl(link) {
    const url = assertGooglePhotos(new URL(link));
    if (url.hostname === SHARE_HOST) return url;
    const response = await fetchFn(url.href, { headers: { "user-agent": SIMPLE_USER_AGENT }, redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) throw new Error(`o link curto não redirecionou (${response.status})`);
    return assertGooglePhotos(new URL(location, url));
  }

  return {
    resolveShareUrl,
    async fetchAlbumPage(link) {
      const shareUrl = await resolveShareUrl(link);
      const response = await fetchFn(shareUrl.href, { headers: { "user-agent": userAgent, "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" }, redirect: "follow" });
      if (!response.ok) throw new Error(`o Google Fotos respondeu ${response.status}`);
      return response.text();
    },
  };
}
