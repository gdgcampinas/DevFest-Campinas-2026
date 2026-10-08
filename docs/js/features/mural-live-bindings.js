/**
 * Liga o que chega das fontes ao vivo (features/mural-live.js) ao mural, pelo que cada fonte declara em `bind` (data/mural-sources.js):
 *   - guarda o dado no estado `live` que as cenas leem (`ctx.live.<nome>`); fonte de várias chaves (pódio por sessão) guarda { key, items } do último com itens;
 *   - quando a lista ACABA DE SER PUBLICADA ao vivo (features/publish-detector.js: viu vazio e depois encheu), empurra a cena de interrupção na frente
 *     do rodízio e dispara a comemoração. Mural aberto com o resultado já publicado não comemora, só mostra a cena no rodízio.
 * `bind.celebrateDelayMs` espera esse tempo antes do papel picado (o pódio entra do 3º ao 1º: a festa é na hora do 1º lugar).
 * `bind.collect` guarda o valor de cada chave de uma fonte de várias (`live[nome][chave]`, ex.: a lista de fotos de cada álbum).
 * `bind.notifyNew` avisa FOTO NOVA numa lista que chega várias vezes (álbum ao vivo): a primeira leitura é a base; as novas vão pra `live[notifyNew.live]` ({ key, photo, photos }, a mais
 * nova primeiro) por `expireMs`, e a cena de destaque entra na frente do rodízio no máximo uma vez a cada `minGapMs` (as outras só entram no rodízio normal, sem enchê-lo de interrupções).
 * Tudo injetado: `definitions`, `live` (objeto de estado), `mural` (pushInterrupt), `celebrate`, `schedule`, `nowMs`, `createDetector`, `createNewDetector`. Dual (navegador e Node).
 */
function createLiveBindings({ definitions, live, mural, celebrate = () => {}, schedule = fn => { fn(); return () => {}; }, nowMs = () => Date.now(), createDetector = createFreshPublishDetector, createNewDetector = createNewItemsDetector }) {
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

  function announceNew(sourceId, key, spec, photos) {
    const fresh = newDetectorFor(sourceId).observe(photos);
    if (!fresh.length) return;
    const announced = { key, photo: fresh[0], photos: fresh };
    live[spec.live] = announced;
    schedule(() => { if (live[spec.live] === announced) delete live[spec.live]; }, spec.expireMs ?? 120000);
    if (nowMs() - (lastNotified.get(sourceId) ?? -Infinity) < (spec.minGapMs ?? 0)) return;
    lastNotified.set(sourceId, nowMs());
    mural.pushInterrupt(spec.interrupt);
  }

  return function onLiveUpdate(sourceId, value) {
    const definition = definitions.find(item => sourceId === item.id || sourceId.startsWith(`${item.id}:`));
    const bind = definition?.bind;
    if (!bind) return;
    if (bind.collect) {
      const key = sourceId.slice(definition.id.length + 1);
      (live[bind.live] ??= {})[key] = value;
      if (bind.notifyNew && value?.photos) announceNew(sourceId, key, bind.notifyNew, value.photos);
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
