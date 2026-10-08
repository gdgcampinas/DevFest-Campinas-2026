/**
 * Adaptadores das fontes ao vivo do mural: cada um devolve um `open(onData, onError)` no contrato de features/mural-live.js.
 *   pollOpen           leitura única repetida de tempos em tempos (ex.: total de inscritos, `repository.get`); vira "escuta" por polling
 *   documentListenOpen escuta de um documento por `repository.listen` (1 leitura por mudança, cabe no plano grátis), depois do login anônimo
 *   buildLiveSources   monta as fontes a partir dos DADOS de data/mural-sources.js, resolvendo repositories e chaves por nome (injetados)
 * Dual (navegador e Node).
 */
function pollOpen({ read, intervalMs, schedule }) {
  return (onData, onError) => {
    let cancel = () => {};
    let stopped = false;
    const tick = async () => {
      try {
        onData(await read());
      } catch (error) {
        stopped = true;
        onError(error);
        return;
      }
      if (!stopped) cancel = schedule(tick, intervalMs);
    };
    tick();
    return () => { stopped = true; cancel(); };
  };
}

function documentListenOpen({ repository, key, getUid = async () => {} }) {
  return async (onData, onError) => {
    await getUid();
    return repository().listen(key, onData, onError);
  };
}

/**
 * `definitions` (data/mural-sources.js): [{ id, enabled, kind: "poll" | "document", repository, key | keys, intervalMs, silenceMs }]
 * `repositories`: { nome: () => repository } (lazy: os repositories do Firebase só existem depois dos módulos)
 * `keyResolvers`: { nome: () => [chaves] } pra fontes de várias chaves (uma escuta por chave, id "<fonte>:<chave>"); cada chave pode ser { key, intervalMs } pra ter o seu
 *   próprio intervalo de leitura (álbum ao vivo a cada 45 s, álbuns antigos a cada 10 min)
 */
function buildLiveSources({ definitions, repositories, keyResolvers = {}, getUid, schedule }) {
  return definitions.flatMap(definition => {
    const repository = repositories[definition.repository];
    const entries = (definition.keys ? keyResolvers[definition.keys]() : [definition.key]).map(entry => (typeof entry === "object" ? entry : { key: entry }));
    return entries.map(({ key, intervalMs = definition.intervalMs }) => ({
      id: definition.keys ? `${definition.id}:${key}` : definition.id,
      sourceId: definition.id,
      enabled: definition.enabled !== false,
      silenceMs: definition.silenceMs,
      open: definition.kind === "poll"
        ? pollOpen({ read: () => repository().get(key), intervalMs, schedule })
        : documentListenOpen({ repository, key, getUid }),
    }));
  });
}

if (typeof module !== "undefined") module.exports = { pollOpen, documentListenOpen, buildLiveSources };
