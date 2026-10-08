/**
 * Destino do QR das cenas (docs/js/features/qr-targets.js): página do site com o ensaio junto, ou o convite do álbum colaborativo pelo intermediário.
 *   node --test DevFestIA/tools/mural/qr-targets.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createQrTargets } = load("features/qr-targets.js");

const targets = options => createQrTargets({ siteUrl: "https://site.test/app/", extraQuery: () => "&ensaio=09:00", albumProxyUrl: "https://proxy.test/", ...options });

test("página do site: o endereço leva o ensaio junto, e o texto embaixo é o endereço sem o protocolo e sem o ensaio", () => {
  assert.deepEqual(targets().resolve({ path: "index.html?avaliar=1" }), { url: "https://site.test/app/index.html?avaliar=1&ensaio=09:00", label: "site.test/app/index.html?avaliar=1" });
});

test("álbum colaborativo: leva ao convite pelo intermediário (sem barra repetida, id seguro) e não escreve o endereço do intermediário na tela", () => {
  assert.deepEqual(targets().resolve({ album: "ao-vivo" }), { url: "https://proxy.test/join/ao-vivo", label: "" });
  assert.equal(targets({ albumProxyUrl: "https://proxy.test" }).resolve({ album: "ao vivo/../x" }).url, "https://proxy.test/join/ao%20vivo%2F..%2Fx");
});

test("sem intermediário ligado o QR do álbum não tem destino (a cena não aparece); página do site continua valendo", () => {
  assert.equal(targets({ albumProxyUrl: "" }).resolve({ album: "ao-vivo" }), null);
  assert.ok(targets({ albumProxyUrl: "" }).resolve({ path: "index.html" }));
});
