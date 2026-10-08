/**
 * Fila de fotos do mural em rodízio: devolve a próxima foto (ou várias) que não esteja de castigo. Foto que falhou (404, rede) fica de fora por `quarantineMs` e volta sozinha
 * depois; o mural nunca insiste numa foto quebrada e nunca fica sem foto se alguma funcionar. Serve às fotos locais (identidade = `file`) e às de álbum (`keyOf`: `id`).
 *   next(accept?)         a próxima utilizável (que `accept` aprove, se vier)
 *   take(count, accept?)  até `count` fotos distintas: primeiro as que `accept` aprova (ex.: só retratos), depois completa com quaisquer
 *   replace(list, opts?)  troca a lista (álbum ao vivo ganhou foto); `restart: true` volta ao começo pra mostrar as mais novas primeiro; os castigos continuam valendo
 * Dual (navegador e Node).
 */
function createPhotoPool({ photos: initial, nowMs, quarantineMs, keyOf = photo => photo.file }) {
  let photos = initial;
  let cursor = 0;
  const blockedUntil = new Map();
  const available = photo => !(blockedUntil.get(keyOf(photo)) > nowMs());
  const always = () => true;

  return {
    next(accept = always) {
      for (let step = 0; step < photos.length; step++) {
        const index = (cursor + step) % photos.length;
        if (available(photos[index]) && accept(photos[index])) {
          cursor = (index + 1) % photos.length;
          return photos[index];
        }
      }
      return null;
    },
    take(count, accept = always) {
      const chosen = [];
      const taken = new Set();
      let last = -1;
      const grab = predicate => {
        for (let step = 0; step < photos.length && chosen.length < count; step++) {
          const index = (cursor + step) % photos.length;
          const photo = photos[index];
          if (available(photo) && !taken.has(keyOf(photo)) && predicate(photo)) {
            chosen.push(photo);
            taken.add(keyOf(photo));
            last = index;
          }
        }
      };
      grab(accept);
      grab(always);
      if (last >= 0) cursor = (last + 1) % photos.length;
      return chosen;
    },
    replace(list, { restart = false } = {}) {
      photos = list;
      cursor = restart || !list.length ? 0 : cursor % list.length;
    },
    reportFailure: photo => blockedUntil.set(keyOf(photo), nowMs() + quarantineMs),
    usable: () => photos.filter(available).length,
  };
}

if (typeof module !== "undefined") module.exports = { createPhotoPool };
