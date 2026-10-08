/**
 * Pra ONDE o QR de uma cena aponta (puro, dual: navegador e Node). A cena de QR só desenha; quem decide o destino é este resolvedor, injetado:
 *   `params.album`  o QR leva ao CONVITE do álbum colaborativo, pelo intermediário (`<albumProxyUrl>/join/<id>`): o link do álbum nunca está no site. Sem intermediário ligado devolve null (a cena não aparece).
 *   `params.path`   uma página do site (`siteUrl + path`), com o `extraQuery()` (o ensaio) junto.
 * Devolve `{ url, label }`: `url` é o que o QR codifica e `label` o endereço escrito embaixo (vazio = sem texto; endereço de intermediário não é pra ler).
 */
function createQrTargets({ siteUrl, extraQuery = () => "", albumProxyUrl = "" }) {
  return {
    resolve(params) {
      if (params.album) {
        if (!albumProxyUrl) return null;
        return { url: `${albumProxyUrl.replace(/\/+$/, "")}/join/${encodeURIComponent(params.album)}`, label: "" };
      }
      return { url: `${siteUrl}${params.path}${extraQuery()}`, label: `${siteUrl}${params.path}`.replace(/^https?:\/\//, "") };
    },
  };
}

if (typeof module !== "undefined") module.exports = { createQrTargets };
