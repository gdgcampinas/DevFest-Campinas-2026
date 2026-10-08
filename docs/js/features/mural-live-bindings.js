/**
 * Liga o que chega das fontes ao vivo (features/mural-live.js) ao mural, pelo que cada fonte declara em `bind` (data/mural-sources.js):
 *   - guarda o dado no estado `live` que as cenas leem (`ctx.live.<nome>`); fonte de várias chaves (pódio por sessão) guarda { key, items } do último com itens;
 *   - quando a lista ACABA DE SER PUBLICADA ao vivo (features/publish-detector.js: viu vazio e depois encheu), empurra a cena de interrupção na frente
 *     do rodízio e dispara a comemoração. Mural aberto com o resultado já publicado não comemora, só mostra a cena no rodízio.
 * `bind.celebrateDelayMs` espera esse tempo antes do papel picado (o pódio entra do 3º ao 1º: a festa é na hora do 1º lugar).
 * Tudo injetado: `definitions`, `live` (objeto de estado), `mural` (pushInterrupt), `celebrate`, `schedule`, `createDetector`. Dual (navegador e Node).
 */
function createLiveBindings({ definitions, live, mural, celebrate = () => {}, schedule = fn => { fn(); return () => {}; }, createDetector = createFreshPublishDetector }) {
  const detectors = new Map();
  const detectorFor = id => {
    if (!detectors.has(id)) detectors.set(id, createDetector());
    return detectors.get(id);
  };

  return function onLiveUpdate(sourceId, value) {
    const definition = definitions.find(item => sourceId === item.id || sourceId.startsWith(`${item.id}:`));
    const bind = definition?.bind;
    if (!bind) return;
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
