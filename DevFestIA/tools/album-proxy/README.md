# Intermediário de álbuns do Google Fotos

O navegador do mural não consegue ler a página de um álbum do Google Fotos (não há CORS), e o Google bloqueia embutir o álbum num iframe. Este intermediário lê a página no servidor,
extrai a lista de fotos e a devolve como JSON pro mural. **Leitura não oficial:** se o Google mudar a página, o leitor devolve erro em vez de uma lista errada e o mural segue com a última lista boa.

## O que ele responde
- `GET /albums` -> `{ "albums": ["ao-vivo", "elotech-agibank", ...] }` (só os ids, nunca os links)
- `GET /albums/<id>` -> `{ id, title, fetchedAt, count, photos: [{ id, url, width, height, takenAt, addedAt }], stale? }`, da foto que entrou por último pra mais antiga.
  `url` é a base; o tamanho se pede com `=w1920-h1080` (o mural monta). `stale: true` = o Google falhou e esta é a última lista boa.

- `GET /join/<id>` -> 302 pro CONVITE do álbum colaborativo (só álbuns com `"live": true`; qualquer outro devolve 404 e nunca o link). É o endereço do QR "Mande sua foto" do mural: o link do álbum fica só no segredo, e trocar o álbum é trocar o segredo, sem tocar no código. O link guardado em `ao-vivo` precisa ser o CONVITE pra colaborar (link só de visualização não deixa ninguém adicionar foto).

- `GET /media/<arquivo.mp4>` -> um clipe de vídeo do mural (`media-service.mjs`), com `content-type: video/mp4`, CORS pros endereços permitidos e cache de 1 dia (e cache da borda da Cloudflare: o GitHub é consultado uma vez). Os arquivos ficam num anexo de release do GitHub (variável `MEDIA_BASE` em `wrangler.toml`, ex.: `https://github.com/gdgcampinas/DevFest-Campinas-2026/releases/download/mural-video-2025/`): o repositório é público e não guarda mídia pesada, e o GitHub não manda CORS, por isso o mural pede ao intermediário. Só nomes `.mp4` simples (sem caminho, sem `..`). Teste local: `MEDIA_DIR=<pasta com os .mp4> node DevFestIA/tools/album-proxy/dev-server.mjs` e `telao.html?albuns=http://localhost:8787`.

- `POST /sync` -> pede ao GitHub pra rodar o job **🎫 Sincronizar Sympla** agora (`sync-trigger.mjs`, `sync-handler.mjs`). O agendamento do próprio GitHub roda em média a cada 4 h, então o Worker também dispara o job **de 1 em 1 hora** (rede de segurança; na semana do evento pode subir pra `*/15 * * * *`) (`[triggers] crons` em `wrangler.toml`) e o site chama `/sync` quando alguém acabou de comprar o ingresso e quer liberar o cartão "Eu vou!" ou entrar no sorteio. Respostas: `202 { status: "started" }`, `429 { status: "cooldown", retryInMs }` (rodou há menos de 2 min), `503` (sem token) e `502` (o GitHub recusou). Nunca devolve o token. CORS só pro site.
  **Configuração única (feita pelo Renato no Terminal, o token nunca vai pro repositório nem pro chat):** crie um token do GitHub **fine-grained**, só neste repositório, permissão **Actions: Read and write** (nenhuma outra), vencimento no fim de novembro; depois `cd DevFestIA/tools/album-proxy && npx wrangler secret put SYNC_GITHUB_TOKEN` (cole o token) e `npx wrangler deploy`. As variáveis `SYNC_REPO` e `SYNC_WORKFLOW` já estão em `wrangler.toml`. Sem o token o `/sync` responde 503 e o resto do intermediário segue igual.

Cache por álbum: o álbum ao vivo vale 45 s e os demais 10 min, e pedidos simultâneos dividem UMA busca, então o Google recebe poucas consultas por minuto não importa quantas telas pedirem.

## Peças (uma responsabilidade por arquivo, tudo injetado)
`parse-album.mjs` (leitor puro) · `google-photos-repository.mjs` (busca a página; link curto em dois passos) · `album-service.mjs` (cache, busca compartilhada, lista antiga em falha) ·
`album-handler.mjs` (HTTP e CORS, independente do provedor) · `sync-trigger.mjs` e `sync-handler.mjs` (disparo do sync do Sympla) · `worker.mjs` (adaptador Cloudflare) · `dev-server.mjs` (servidor local) · `memory-cache.mjs`.

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
Mural local: `telao.html?lineup=1&albuns=http://localhost:8787`.

## Publicar no Cloudflare Workers (gratuito)
```bash
cd DevFestIA/tools/album-proxy
npx wrangler login
npx wrangler secret put ALBUMS        # cole o JSON acima
npx wrangler deploy                   # devolve https://devfest-album-proxy.<conta>.workers.dev
```
Depois, colocar esse endereço em `MURAL_CONFIG.albums.proxyUrl` (`docs/js/data/mural-config.js`). Variável opcional `ALLOWED_ORIGINS` (lista separada por vírgula; padrão: o site e o localhost).
