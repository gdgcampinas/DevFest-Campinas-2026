/**
 * Entrega dos CLIPES DE VÍDEO do mural (rota `/media/<arquivo>` do intermediário). Os arquivos ficam num anexo de release do GitHub (fora do repositório, que é público e não guarda mídia pesada); o
 * navegador do mural não consegue baixá-los direto (o GitHub não manda CORS), então o intermediário busca e entrega com CORS e cache. Só nomes `.mp4` simples (letras minúsculas, números, ponto, hífen,
 * sublinhado): nada de caminho, nada de `..`. Tudo injetado: `source(name)` devolve a `Response` do arquivo (release do GitHub no Worker, pasta local no servidor de teste).
 */
export class MediaError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const NAME = /^[a-z0-9][a-z0-9._-]{0,80}\.mp4$/;

export function createMediaService({ source }) {
  return {
    async get(name) {
      if (!source) throw new MediaError("vídeos desligados", 404);
      if (!NAME.test(name) || name.includes("..")) throw new MediaError("arquivo não encontrado", 404);
      let upstream;
      try {
        upstream = await source(name);
      } catch {
        throw new MediaError("não consegui buscar o vídeo", 502);
      }
      if (upstream.status === 404) throw new MediaError("arquivo não encontrado", 404);
      if (!upstream.ok) throw new MediaError("não consegui buscar o vídeo", 502);
      return upstream;
    },
  };
}

/** Fonte: anexos de uma release do GitHub (`baseUrl` termina em `/releases/download/<tag>/`). Vazio = vídeos desligados. */
export function releaseSource({ baseUrl, fetchFn = fetch }) {
  return baseUrl ? name => fetchFn(`${baseUrl}${name}`, { redirect: "follow" }) : null;
}
