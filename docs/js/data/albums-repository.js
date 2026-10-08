/**
 * Repository dos ÁLBUNS do Google Fotos no mural: a "API" é o intermediário em DevFestIA/tools/album-proxy (`GET <baseUrl>/albums/<id>`), que devolve a lista de fotos de um álbum.
 * `get(id)` devolve { id, title, fetchedAt, count, photos: [{ id, url, width, height, takenAt, addedAt }] } (da foto que entrou por último pra mais antiga) e GUARDA a última lista boa no
 * navegador: se o intermediário cair ou a rede falhar, devolve a guardada marcada `stale: true` em vez de erro, e o mural segue com as fotos que já conhece.
 * Tudo injetado: `baseUrl`, `fetchFn`, `storage` (localStorage ou de mentira), `timeoutMs`, `schedule`. Dual (navegador e Node).
 */
function sanitizeAlbumPhotos(photos) {
  return (Array.isArray(photos) ? photos : [])
    .filter(photo => photo && typeof photo.id === "string" && typeof photo.url === "string" && photo.url.startsWith("https://") && photo.width > 0 && photo.height > 0)
    .map(photo => ({ id: photo.id, url: photo.url, width: photo.width, height: photo.height, takenAt: photo.takenAt ?? null, addedAt: photo.addedAt ?? null }));
}

function createAlbumsRepository({ baseUrl, fetchFn = globalThis.fetch?.bind(globalThis), storage = null, timeoutMs = 8000, schedule = defaultSchedule, storageKey = "devfest-campinas-2026:albums" }) {
  const readAll = () => {
    try {
      return JSON.parse(storage?.getItem(storageKey) ?? "{}");
    } catch {
      return {};
    }
  };
  const lastGood = id => readAll()[id] ?? null;
  const save = album => {
    try {
      storage?.setItem(storageKey, JSON.stringify({ ...readAll(), [album.id]: album }));
    } catch {
      /* sem espaço ou modo privado: segue sem guardar */
    }
  };

  return {
    lastGood,
    async get(id) {
      try {
        const response = await withTimeout(fetchFn(`${baseUrl.replace(/\/+$/, "")}/albums/${encodeURIComponent(id)}`), timeoutMs, schedule, "o intermediário de álbuns demorou demais");
        if (!response.ok) throw new Error(`o intermediário respondeu ${response.status}`);
        const body = await response.json();
        const photos = sanitizeAlbumPhotos(body.photos);
        if (!photos.length) throw new Error("álbum sem fotos utilizáveis");
        const album = { id, title: body.title ?? id, fetchedAt: body.fetchedAt ?? null, count: photos.length, photos, ...(body.stale && { stale: true }) };
        save(album);
        return album;
      } catch (error) {
        const saved = lastGood(id);
        if (saved) return { ...saved, stale: true };
        throw error;
      }
    },
  };
}

if (typeof module !== "undefined") module.exports = { createAlbumsRepository, sanitizeAlbumPhotos };
