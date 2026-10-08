/**
 * Servidor LOCAL do intermediário (teste do mural com os álbuns de verdade, sem Cloudflare). Mesmas peças do Worker, só o cache é em memória.
 *   ALBUMS='{"ao-vivo":{"url":"https://photos.app.goo.gl/...","live":true},"elotech-agibank":"https://photos.app.goo.gl/..."}' node DevFestIA/tools/album-proxy/dev-server.mjs
 * Vídeos do mural: `MEDIA_DIR=<pasta com os .mp4>` serve a rota /media/ de uma pasta local (teste dos clipes antes de publicar a release). Mural: `mural.html?albuns=http://localhost:8787`.
 * Os links vão na variável de ambiente (nunca em arquivo do repositório). Porta 8787 (ou PORT). Mural: `mural.html?albuns=http://localhost:8787`.
 */
import http from "node:http";
import { parseAlbumPage } from "./parse-album.mjs";
import { createGooglePhotosRepository } from "./google-photos-repository.mjs";
import { createAlbumService } from "./album-service.mjs";
import { createAlbumHandler } from "./album-handler.mjs";
import { createMemoryCache } from "./memory-cache.mjs";
import { createMediaService } from "./media-service.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT ?? 8787);
const service = createAlbumService({ registry: JSON.parse(process.env.ALBUMS ?? "{}"), repository: createGooglePhotosRepository(), cache: createMemoryCache(), parse: parseAlbumPage });
const mediaDir = process.env.MEDIA_DIR;
const media = createMediaService({ source: mediaDir ? async name => new Response(await readFile(path.join(mediaDir, name)), { headers: { "content-type": "video/mp4" } }) : null });
const handle = createAlbumHandler({ service, media, allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "https://gdgcampinas.github.io,http://localhost:8080,http://127.0.0.1:8080").split(",") });

http.createServer(async (req, res) => {
  const response = await handle(new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers: req.headers }));
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.log(`intermediário de álbuns em http://localhost:${port}/albums (${service.ids().length} álbuns)`));
