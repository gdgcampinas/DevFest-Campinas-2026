/**
 * Liga o que chega das fontes ao vivo (features/mural-live.js) ao mural, pelo que cada fonte declara em `bind` (data/mural-sources.js):
 *   - guarda o dado no estado `live` que as cenas leem (`ctx.live.<nome>`); fonte de várias chaves (pódio por sessão) guarda { key, items } do último com itens;
 *   - quando a lista ACABA DE SER PUBLICADA ao vivo (features/publish-detector.js: viu vazio e depois encheu), empurra a cena de interrupção na frente
 *     do rodízio e dispara a comemoração. Mural aberto com o resultado já publicado não comemora, só mostra a cena no rodízio.
 * `bind.celebrateDelayMs` espera esse tempo antes do papel picado (o pódio entra do 3º ao 1º: a festa é na hora do 1º lugar).
 * `bind.collect` guarda o valor de cada chave de uma fonte de várias (`live[nome][chave]`, ex.: a lista de fotos de cada álbum); `collect: { field }` guarda só aquele campo do documento
 * (ex.: `ids` das fotos escondidas), e documento que não existe vira lista vazia.
 * `bind.notifyNew` avisa FOTO NOVA numa lista que chega várias vezes (álbum ao vivo): a primeira leitura é a base; as novas vão pra `live[notifyNew.live]` ({ key, photo, photos }, a mais
 * nova primeiro) por `expireMs`, e a cena de destaque entra na frente do rodízio no máximo uma vez a cada `minGapMs` (as outras só entram no rodízio normal, sem enchê-lo de interrupções).
 * `bind.renotify` (id de OUTRA fonte com `notifyNew`, ex.: `album-live`): quando este documento muda (as fotos aprovadas), refaz o aviso de foto nova daquela fonte com a lista que já chegou, pra foto que o moderador acabou de aprovar ganhar o destaque.
 * `visiblePhotos(chave, fotos)` filtra o que vale como foto nova (álbum com aprovação: só as aprovadas) e devolve `null` enquanto a lista de aprovadas ainda não chegou (nada é anunciado, e a primeira lista completa vira a base).
 * `bind.handle` entrega o documento inteiro a um TRATADOR injetado por nome (`handlers`: ex.: o controle remoto, features/mural-control.js).
 * Tudo injetado: `definitions`, `live` (objeto de estado), `mural` (pushInterrupt), `handlers`, `celebrate`, `schedule`, `nowMs`, `createDetector`, `createNewDetector`. Dual (navegador e Node).
 */
function createLiveBindings({ definitions, live, mural, handlers = {}, celebrate = () => {}, schedule = fn => { fn(); return () => {}; }, nowMs = () => Date.now(), createDetector = createFreshPublishDetector, createNewDetector = createNewItemsDetector, visiblePhotos = (key, photos) => photos }) {
  const detectors = new Map();
  const newDetectors = new Map();
  const lastNotified = new Map();
  const detectorFor = id => {
    if (!detectors.has(id)) detectors.set(id, createDetector());
    return detectors.get(id);
  };
  const newDetectorFor = id => {
    if (!newDetectors.has(id)) newDetectors.set(id, createNewDetector());
    return newDetectors.get(id);
  };

  function announceNew(sourceId, key, spec, allPhotos) {
    const photos = visiblePhotos(key, allPhotos);
    if (!photos) return;
    const fresh = newDetectorFor(sourceId).observe(photos);
    if (!fresh.length) return;
    const announced = { key, photo: fresh[0], photos: fresh };
    live[spec.live] = announced;
    schedule(() => { if (live[spec.live] === announced) delete live[spec.live]; }, spec.expireMs ?? 120000);
    if (nowMs() - (lastNotified.get(sourceId) ?? -Infinity) < (spec.minGapMs ?? 0)) return;
    lastNotified.set(sourceId, nowMs());
    mural.pushInterrupt(spec.interrupt);
  }

  /** Refaz o aviso de foto nova da fonte `targetId` (a de `notifyNew`) pro álbum `key`, com a lista que ela já entregou. */
  function renotify(targetId, key) {
    const spec = definitions.find(item => item.id === targetId)?.bind?.notifyNew;
    const photos = live[definitions.find(item => item.id === targetId)?.bind?.live]?.[key]?.photos;
    if (spec && photos) announceNew(`${targetId}:${key}`, key, spec, photos);
  }

  return function onLiveUpdate(sourceId, value) {
    const definition = definitions.find(item => sourceId === item.id || sourceId.startsWith(`${item.id}:`));
    const bind = definition?.bind;
    if (!bind) return;
    if (bind.handle) {
      handlers[bind.handle]?.(value);
      return;
    }
    if (bind.collect) {
      const key = sourceId.slice(definition.id.length + 1);
      const field = bind.collect.field;
      (live[bind.live] ??= {})[key] = field ? value?.[field] ?? [] : value;
      if (bind.notifyNew && value?.photos) announceNew(sourceId, key, bind.notifyNew, value.photos);
      if (bind.renotify) renotify(bind.renotify, key);
      return;
    }
    if (!bind.pick) {
      live[bind.live] = value;
      return;
    }
    const key = sourceId.slice(definition.id.length + 1);
    const items = value?.[bind.pick] ?? [];
    const fresh = detectorFor(sourceId).observe(items);
    if (items.length) live[bind.live] = { key, items };
    else if (live[bind.live]?.key === key) delete live[bind.live];
    if (!fresh) return;
    if (bind.interrupt) mural.pushInterrupt(bind.interrupt);
    if (bind.celebrate) schedule(celebrate, bind.celebrateDelayMs ?? 0);
  };
}

if (typeof module !== "undefined") module.exports = { createLiveBindings };
