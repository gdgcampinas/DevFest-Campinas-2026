/**
 * Fila de fotos do mural em rodízio: devolve a próxima foto que não esteja de castigo. Foto que falhou (404, rede) fica de fora por
 * `quarantineMs` e volta sozinha depois; o mural nunca insiste numa foto quebrada e nunca fica sem foto se alguma funcionar. Dual (navegador e Node).
 */
function createPhotoPool({ photos, nowMs, quarantineMs }) {
  let cursor = 0;
  const blockedUntil = new Map();
  const available = photo => !(blockedUntil.get(photo.file) > nowMs());

  return {
    /** A próxima foto utilizável, ou null se todas estão de castigo. */
    next() {
      for (let step = 0; step < photos.length; step++) {
        const photo = photos[(cursor + step) % photos.length];
        if (available(photo)) {
          cursor = (cursor + step + 1) % photos.length;
          return photo;
        }
      }
      return null;
    },
    reportFailure: photo => blockedUntil.set(photo.file, nowMs() + quarantineMs),
    usable: () => photos.filter(available).length,
  };
}

if (typeof module !== "undefined") module.exports = { createPhotoPool };
