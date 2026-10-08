/**
 * Cena de ÁLBUM do Google Fotos: mostra X fotos de um álbum no MODELO escolhido. Tudo por dado: `params.album` (data/mural-albums.js), `params.model` (collage, portrait-strip,
 * polaroid, feature, mosaic ou "auto", que escolhe pela orientação das fotos do álbum), `params.count` (quantas fotos; padrão do modelo), `params.badge` (selo, ex.: "Nova foto da galera") e
 * `params.latest` (a foto mais nova que acabou de chegar, `ctx.live.newPhoto`, em destaque grande no modelo "feature", com as mais recentes ao lado).
 * NUNCA uma foto sozinha: cada modelo tem um mínimo (`min`, data/mural-album-models.js) e com menos fotos que isso a cena não aparece (MURAL_SKIP) até o álbum encher.
 * A lista de fotos vem da fonte ao vivo (`ctx.live.albums[id]`, lida do intermediário a cada 45 s no ao vivo); fotos que o moderador escondeu (`ctx.live.hidden[id]`, lista de ids) não entram.
 * Cada foto é pré-carregada NO TAMANHO que o modelo usa, com tempo limite; a que falha vai de castigo e é trocada por outra na mesma preparação, então nunca aparece imagem quebrada.
 * Sem lista (intermediário fora do ar e nada guardado) a cena não aparece (MURAL_SKIP) e o rodízio segue com as outras.
 * Tudo injetado: `albums`, `models` e `autoRules` (data), `renderers` (um por modelo), `createPool` (fila de fotos por álbum), `preload`, `orderPhotos`.
 */
function createAlbumScene({ albums, models, autoRules, renderers, createPool, preload, orderPhotos = photos => photos }) {
  const pools = new Map();
  const acceptFor = prefer => (prefer === "any" ? undefined : photo => photoOrientation(photo) === prefer);
  const tileOf = (model, index) => model.tiles[Math.min(index, model.tiles.length - 1)];

  /** A fila do álbum; se a lista mudou (foto nova, foto escondida) a fila é trocada, e no álbum "newest" recomeça pelas mais novas. */
  function poolFor(meta, photos) {
    const signature = `${photos.length}:${photos[0].id}:${photos[photos.length - 1].id}`;
    const entry = pools.get(meta.id);
    if (!entry) {
      const pool = createPool(orderPhotos(photos, meta.order));
      pools.set(meta.id, { pool, signature });
      return pool;
    }
    if (entry.signature !== signature) {
      entry.pool.replace(orderPhotos(photos, meta.order), { restart: meta.order === "newest" });
      entry.signature = signature;
    }
    return entry.pool;
  }

  return {
    async prepare(params, ctx) {
      const meta = albums.get(params.album);
      if (!meta) throw new Error(`álbum desconhecido: ${params.album}`);
      const album = ctx.live.albums?.[meta.id];
      if (!album) return MURAL_SKIP;
      const hidden = new Set(ctx.live.hidden?.[meta.id] ?? []);
      const photos = album.photos.filter(photo => !hidden.has(photo.id));
      if (!photos.length) return MURAL_SKIP;

      let model;
      let pool = null;
      let candidates;
      if (params.latest) {
        const latest = ctx.live.newPhoto;
        if (!latest || latest.key !== meta.id || hidden.has(latest.photo.id)) return MURAL_SKIP;
        model = chooseAlbumModel({ model: "feature", photos, models, autoRules });
        candidates = [latest.photo, ...photos.filter(photo => photo.id !== latest.photo.id)].slice(0, params.count ?? model.count);
      } else {
        model = chooseAlbumModel({ model: params.model, photos, models, autoRules });
        pool = poolFor(meta, photos);
        candidates = pool.take(params.count ?? model.count, acceptFor(model.prefer));
      }
      const min = Math.min(model.min ?? 1, params.count ?? model.count);
      if (photos.length < min) return MURAL_SKIP;

      const items = [];
      const tried = new Set();
      for (let attempt = 0; attempt < 2 && candidates.length; attempt++) {
        const loaded = (await Promise.all(candidates.map((photo, index) => {
          tried.add(photo.id);
          const url = albumPhotoUrl(photo, tileOf(model, items.length + index));
          return preload(url).then(() => ({ photo, url }), () => { pool?.reportFailure(photo); return null; });
        }))).filter(Boolean);
        const missing = candidates.length - loaded.length;
        items.push(...loaded);
        // só refaz o que FALHOU, com fotos que ainda não foram tentadas (álbum pequeno nunca repete a mesma foto)
        candidates = missing && pool ? pool.take(missing, acceptFor(model.prefer)).filter(photo => !tried.has(photo.id)) : [];
      }
      if (!items.length) throw new Error("nenhuma foto do álbum carregou");
      if (items.length < min) return MURAL_SKIP;
      return { meta, model, items, badge: params.badge ?? "" };
    },
    render({ meta, model, items, badge }) {
      const renderer = renderers[model.id];
      if (!renderer) throw new Error(`sem desenhador pro modelo de álbum: ${model.id}`);
      return { markup: renderer.render({ items, captionMarkup: muralAlbumCaptionMarkup({ label: meta.label, live: meta.live, badge }) }) };
    },
  };
}
