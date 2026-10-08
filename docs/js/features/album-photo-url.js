/**
 * Fotos de ÁLBUM (Google Fotos, via o intermediário em DevFestIA/tools/album-proxy): o endereço-base da foto aceita o tamanho no fim (`=w1920-h1080`), então cada modelo de exibição pede
 * só o tamanho que vai usar (a colagem não baixa uma foto de 4 MB pra um quadrinho). Única parte do site que sabe montar esse endereço. Dual (navegador e Node).
 */
function albumPhotoUrl(photo, { width, height }) {
  return `${photo.url}=w${Math.round(width)}-h${Math.round(height)}`;
}

/** "landscape" (paisagem), "portrait" (retrato) ou "square" (quase quadrada). */
function photoOrientation(photo) {
  const ratio = photo.width / photo.height;
  return ratio > 1.05 ? "landscape" : ratio < 0.95 ? "portrait" : "square";
}

/** Fração de cada orientação numa lista de fotos ({ portrait, landscape, square }, somando 1; lista vazia = tudo 0). */
function orientationShare(photos) {
  const share = { portrait: 0, landscape: 0, square: 0 };
  photos.forEach(photo => { share[photoOrientation(photo)] += 1 / photos.length; });
  return share;
}

if (typeof module !== "undefined") module.exports = { albumPhotoUrl, photoOrientation, orientationShare };
