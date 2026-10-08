/**
 * Caso de uso do intermediário: devolve a lista de fotos de um álbum pelo ID (o link do álbum fica só no registro, que vem de um segredo, nunca no código nem na resposta).
 *   - cache por álbum com validade (ao vivo: curta; os demais: longa), então o Google é consultado poucas vezes por minuto, não importa quantas telas pedirem;
 *   - pedidos simultâneos do mesmo álbum compartilham UMA busca;
 *   - se a busca ou a leitura falhar, devolve a última lista boa marcada `stale: true` (até `staleMaxMs`), em vez de erro.
 * `joinUrl(id)`: o convite pra COLABORAR, só pros álbuns `live` (colaborativos, como o das pessoas do evento): é pra onde o QR do mural leva. Álbum de evento passado nunca devolve o link (404).
 * Tudo injetado: `registry` ({ id: link | { url, live } }), `repository` (google-photos-repository), `cache` ({ get(key), set(key, value) }), `now`, `parse`, `ttl`.
 */
export class AlbumError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function createAlbumService({ registry, repository, cache, now = () => Date.now(), parse, ttl = { live: 45_000, default: 600_000 }, staleMaxMs = 6 * 3_600_000 }) {
  const inflight = new Map();
  const entryOf = id => {
    const entry = Object.hasOwn(registry, id) ? registry[id] : null;
    if (!entry) throw new AlbumError(`álbum desconhecido: ${id}`, 404);
    return typeof entry === "string" ? { url: entry, live: false } : entry;
  };

  async function refresh(id, entry) {
    const parsed = parse(await repository.fetchAlbumPage(entry.url));
    if (!parsed.ok) throw new Error(parsed.reason);
    const value = { id, title: parsed.title, fetchedAt: now(), count: parsed.photos.length, photos: parsed.photos };
    await cache.set(id, value);
    return value;
  }

  return {
    ids: () => Object.keys(registry),
    joinUrl(id) {
      const entry = entryOf(id);
      if (!entry.live) throw new AlbumError(`álbum sem convite: ${id}`, 404);
      return entry.url;
    },
    async getAlbum(id) {
      const entry = entryOf(id);
      const cached = await cache.get(id);
      const age = cached ? now() - cached.fetchedAt : Infinity;
      if (cached && age < (entry.live ? ttl.live : ttl.default)) return cached;
      if (!inflight.has(id)) inflight.set(id, refresh(id, entry).finally(() => inflight.delete(id)));
      try {
        return await inflight.get(id);
      } catch (error) {
        if (cached && age < staleMaxMs) return { ...cached, stale: true };
        throw new AlbumError(`não consegui ler o álbum ${id}: ${error.message}`, 502);
      }
    },
  };
}
