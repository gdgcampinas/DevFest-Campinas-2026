/**
 * Pra onde o site pede o sync do Sympla na hora (o Worker do intermediário, DevFestIA/tools/album-proxy: `POST /sync` dispara o job no GitHub). `url` vazio = sem pedido, só consulta de novo. `waitMs` = quanto
 * esperar a inscrição aparecer depois do pedido (o job leva ~1 min) e `pollMs` = de quanto em quanto tempo consultar. Só números e endereços.
 */
const REGISTRATION_SYNC_CONFIG = {
  url: "https://devfest-album-proxy.gdgcampinas-devfest.workers.dev/sync",
  waitMs: 90000,
  pollMs: 6000,
};

const registrationSyncConfigRepository = createRepository(REGISTRATION_SYNC_CONFIG);
