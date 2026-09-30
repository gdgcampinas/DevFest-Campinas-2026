/**
 * Testes do código do QR do sorteio (docs/js/features/raffle-session.js): geração, viradas e o link do QR.
 *   node --test DevFestIA/tools/raffle/raffle-session.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { RAFFLE_CODE_ALPHABET, RAFFLE_CODE_LENGTH, generateRaffleCode, nextRaffleSession, raffleCheckinUrl, secureRandomInt } = require("../../../docs/js/features/raffle-session.js");

test("código: tamanho certo, só caracteres sem ambiguidade e diferente a cada vez", () => {
  const codes = new Set();
  for (let i = 0; i < 500; i++) {
    const code = generateRaffleCode();
    assert.equal(code.length, RAFFLE_CODE_LENGTH);
    assert.ok([...code].every(char => RAFFLE_CODE_ALPHABET.includes(char)), code);
    codes.add(code);
  }
  assert.equal(codes.size, 500, "500 códigos seguidos sem repetição");
  assert.ok(!/[01OIL]/.test([...codes].join("")), "sem 0, 1, O, I, L");
});

test("código: o sorteador vem por parâmetro (teste determinístico)", () => {
  assert.equal(generateRaffleCode(() => 0, 4), "2222");
  assert.equal(generateRaffleCode(max => max - 1, 3), "ZZZ");
});

test("sorteador seguro: fica dentro do intervalo e usa o intervalo todo", () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const value = secureRandomInt(10);
    assert.ok(Number.isInteger(value) && value >= 0 && value < 10);
    seen.add(value);
  }
  assert.equal(seen.size, 10);
});

test("virada: a primeira só tem o código; as seguintes guardam o anterior (e só ele)", () => {
  const first = nextRaffleSession(null, "AAAA1111");
  assert.deepEqual(first, { code: "AAAA1111" });
  const second = nextRaffleSession(first, "BBBB2222");
  assert.deepEqual(second, { code: "BBBB2222", previous: "AAAA1111" });
  assert.deepEqual(nextRaffleSession(second, "CCCC3333"), { code: "CCCC3333", previous: "BBBB2222" });
});

test("link do QR: a própria página com só ?checkin=<código>, sem outros parâmetros", () => {
  assert.equal(raffleCheckinUrl("https://x.github.io/DevFest/sorteio.html?lineup=1&telao=1#topo", "ABC234"), "https://x.github.io/DevFest/sorteio.html?checkin=ABC234");
  assert.equal(raffleCheckinUrl("https://x.github.io/DevFest/DEV/sorteio.html", "ABC234"), "https://x.github.io/DevFest/DEV/sorteio.html?checkin=ABC234");
});
