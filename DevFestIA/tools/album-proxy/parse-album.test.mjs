/**
 * Leitor da página do álbum (parse-album.mjs): formato do Google Fotos, ordem, repetidas, textos com colchetes, título e página que mudou.
 *   node --test DevFestIA/tools/album-proxy/*.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { parseAlbumPage, albumTitle } from "./parse-album.mjs";
import { albumPage } from "./album-fixture.mjs";

test("lê id, endereço-base, tamanho e os dois horários de cada foto, da mais nova (entrou por último) pra mais antiga", () => {
  const page = albumPage({ items: [
    { id: "AF1QipAAA", width: 3000, height: 2000, takenAt: 10, addedAt: 100 },
    { id: "AF1QipBBB", width: 1080, height: 1920, takenAt: 20, addedAt: 300 },
    { id: "AF1QipCCC", addedAt: 200 },
  ] });
  const result = parseAlbumPage(page);
  assert.equal(result.ok, true);
  assert.deepEqual(result.photos.map(photo => photo.id), ["AF1QipBBB", "AF1QipCCC", "AF1QipAAA"]);
  assert.deepEqual(result.photos[0], { id: "AF1QipBBB", url: "https://lh3.googleusercontent.com/pw/AF1QipBBB", width: 1080, height: 1920, takenAt: 20, addedAt: 300 });
});

test("foto repetida na página sai uma vez só", () => {
  const result = parseAlbumPage(albumPage({ items: [{ id: "AF1QipAAA" }, { id: "AF1QipAAA" }, { id: "AF1QipBBB" }] }));
  assert.equal(result.photos.length, 2);
});

test("texto com colchetes dentro das aspas (nome da câmera, texto solto) não quebra o fechamento do item", () => {
  const result = parseAlbumPage(albumPage({ items: [{ id: "AF1QipAAA" }, { id: "AF1QipBBB" }] }));
  assert.deepEqual(result.photos.map(photo => photo.id).sort(), ["AF1QipAAA", "AF1QipBBB"]);
});

test("o título vem do og:title sem a data e o emoji; entidades HTML são decodificadas", () => {
  assert.equal(parseAlbumPage(albumPage({ title: "DevFest Campinas 2026 - Ao vivo", items: [{ id: "AF1QipAAA" }] })).title, "DevFest Campinas 2026 - Ao vivo");
  assert.equal(albumTitle('<meta property="og:title" content="Rock &amp; Roll · Aug 1 📸">'), "Rock & Roll");
  assert.equal(albumTitle("<title>Sem og - Google Photos</title>"), "Sem og");
});

test("página que o Google mudou (sem fotos no formato conhecido) devolve ok:false com o motivo, nunca uma lista errada", () => {
  const broken = `<html>${" ".repeat(3000)}<script>algo:[["x",["https://exemplo.com/a.jpg",1,2]]]</script></html>`;
  assert.deepEqual(parseAlbumPage(broken), { ok: false, reason: "nenhuma foto encontrada (o formato da página mudou?)" });
  assert.equal(parseAlbumPage("").ok, false);
  assert.equal(parseAlbumPage(null).ok, false);
  assert.equal(parseAlbumPage("<html>curta</html>").ok, false);
});

test("item truncado ou com JSON inválido é ignorado e os bons continuam", () => {
  const good = albumPage({ items: [{ id: "AF1QipGOOD" }] });
  const withBad = good.replace("<script>", '<script>["AF1QipBAD",["https://lh3.googleusercontent.com/pw/BAD",1,2 /* sem fechar */ ');
  const result = parseAlbumPage(withBad);
  assert.equal(result.ok, true);
  assert.deepEqual(result.photos.map(photo => photo.id), ["AF1QipGOOD"]);
});

test("horário ausente vira null e a foto continua valendo", () => {
  const page = albumPage({ items: [{ id: "AF1QipAAA" }] }).replace(/,1700000000000,"chave",-10800000,1700000100000,/, ',null,"chave",-10800000,null,');
  const [photo] = parseAlbumPage(page).photos;
  assert.deepEqual([photo.takenAt, photo.addedAt], [null, null]);
});
