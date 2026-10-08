# Intermediário de álbuns do Google Fotos

O navegador do mural não consegue ler a página de um álbum do Google Fotos (não há CORS), e o Google bloqueia embutir o álbum num iframe. Este intermediário lê a página no servidor,
extrai a lista de fotos e a devolve como JSON pro mural. **Leitura não oficial:** se o Google mudar a página, o leitor devolve erro em vez de uma lista errada e o mural segue com a última lista boa.

## O que ele responde
- `GET /albums` -> `{ "albums": ["ao-vivo", "elotech-agibank", ...] }` (só os ids, nunca os links)
- `GET /albums/<id>` -> `{ id, title, fetchedAt, count, photos: [{ id, url, width, height, takenAt, addedAt }], stale? }`, da foto que entrou por último pra mais antiga.
  `url` é a base; o tamanho se pede com `=w1920-h1080` (o mural monta). `stale: true` = o Google falhou e esta é a última lista boa.

- `GET /join/<id>` -> 302 pro CONVITE do álbum colaborativo (só álbuns com `"live": true`; qualquer outro devolve 404 e nunca o link). É o endereço do QR "Mande sua foto" do mural: o link do álbum fica só no segredo, e trocar o álbum é trocar o segredo, sem tocar no código. O link guardado em `ao-vivo` precisa ser o CONVITE pra colaborar (link só de visualização não deixa ninguém adicionar foto).

Cache por álbum: o álbum ao vivo vale 45 s e os demais 10 min, e pedidos simultâneos dividem UMA busca, então o Google recebe poucas consultas por minuto não importa quantas telas pedirem.

## Peças (uma responsabilidade por arquivo, tudo injetado)
`parse-album.mjs` (leitor puro) · `google-photos-repository.mjs` (busca a página; link curto em dois passos) · `album-service.mjs` (cache, busca compartilhada, lista antiga em falha) ·
`album-handler.mjs` (HTTP e CORS, independente do provedor) · `worker.mjs` (adaptador Cloudflare) · `dev-server.mjs` (servidor local) · `memory-cache.mjs`.

## Os links dos álbuns NUNCA vão pro repositório
O repositório é público e a chave do link dá acesso ao álbum. Os links ficam num segredo/variável `ALBUMS` (JSON):
```json
{ "ao-vivo": { "url": "https://photos.app.goo.gl/...", "live": true }, "elotech-agibank": "https://photos.app.goo.gl/..." }
```
`live: true` = cache curto (45 s). O mural só conhece os ids.

## Testar localmente
```bash
node --test DevFestIA/tools/album-proxy/*.test.mjs
ALBUMS='{"ao-vivo":{"url":"https://photos.app.goo.gl/...","live":true}}' node DevFestIA/tools/album-proxy/dev-server.mjs   # http://localhost:8787/albums
```
Mural local: `mural.html?lineup=1&albuns=http://localhost:8787`.

## Publicar no Cloudflare Workers (gratuito)
```bash
cd DevFestIA/tools/album-proxy
npx wrangler login
npx wrangler secret put ALBUMS        # cole o JSON acima
npx wrangler deploy                   # devolve https://devfest-album-proxy.<conta>.workers.dev
```
Depois, colocar esse endereço em `MURAL_CONFIG.albums.proxyUrl` (`docs/js/data/mural-config.js`). Variável opcional `ALLOWED_ORIGINS` (lista separada por vírgula; padrão: o site e o localhost).
