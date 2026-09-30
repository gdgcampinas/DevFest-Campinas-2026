/**
 * Código do QR do sorteio (regras puras, sem DOM nem Firebase; DUAL: navegador e Node, testado em
 * DevFestIA/tools/raffle/). O QR que a organização mostra no telão carrega um código que muda a cada minuto
 * (`sorteio.html?checkin=<código>`); o moderador grava o código atual (e o anterior, pra quem escaneou na virada)
 * em `raffle-session/current`, e as regras do Firestore só aceitam o check-in do sorteio com um desses dois.
 * Assim a foto do QR mandada no WhatsApp deixa de valer em até dois minutos, e ninguém se cadastra de longe.
 * Tudo por parâmetro (`randomInt`, `length`): quem chama injeta o sorteador.
 */
const RAFFLE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // sem 0/O/1/I/L: dá pra ler e digitar sem confundir
const RAFFLE_CODE_LENGTH = 8;
const RAFFLE_CODE_PERIOD_MS = 60000;
const RAFFLE_SESSION_ID = "current"; // único documento de `raffle-session`

/** Número inteiro de 0 a `max - 1`, do gerador seguro do navegador/Node (nunca Math.random: o código é uma credencial). */
function secureRandomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max; // descarta o resto que enviesaria o sorteio
  const buffer = new Uint32Array(1);
  do globalThis.crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
}

function generateRaffleCode(randomInt = secureRandomInt, length = RAFFLE_CODE_LENGTH) {
  return Array.from({ length }, () => RAFFLE_CODE_ALPHABET[randomInt(RAFFLE_CODE_ALPHABET.length)]).join("");
}

/** O documento da próxima virada: o código novo e, como `previous`, o que era o atual (vale até a virada seguinte). */
function nextRaffleSession(current, code) {
  return current?.code ? { code, previous: current.code } : { code };
}

/** Link que o QR do sorteio abre: a própria página, só com `?checkin=<código>` (limpa qualquer outro parâmetro,
 * ex.: `?lineup=1`). Dual (sem `location`): quem chama passa a URL atual. */
function raffleCheckinUrl(href, code) {
  const url = new URL(href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("checkin", code);
  return url.toString();
}

if (typeof module !== "undefined") module.exports = { RAFFLE_CODE_ALPHABET, RAFFLE_CODE_LENGTH, RAFFLE_CODE_PERIOD_MS, RAFFLE_SESSION_ID, secureRandomInt, generateRaffleCode, nextRaffleSession, raffleCheckinUrl };
