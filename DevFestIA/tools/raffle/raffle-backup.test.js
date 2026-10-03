/**
 * Testes da cópia em CSV dos sorteios (docs/js/features/raffle-backup.js), baixada antes do reset de emergência.
 *   node --test DevFestIA/tools/raffle/raffle-backup.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildRaffleBackup, csvCell } = require("../../../docs/js/features/raffle-backup.js");

const now = new Date("2026-11-28T15:04:30Z");
const draw = (prize, name, extra = {}) => ({ id: `e${prize}_draw`, entryId: `e${prize}`, prize, name, status: "winner", createdAtMs: Date.parse("2026-11-28T14:00:00Z") + prize * 60000, ...extra });

test("arquivo: nome com data e hora, tipo CSV UTF-8 e BOM pro Excel", () => {
  const backup = buildRaffleBackup([draw(1, "Ana Souza")], { now });
  assert.equal(backup.filename, "sorteio-backup-2026-11-28-15-04.csv");
  assert.equal(backup.mimeType, "text/csv;charset=utf-8");
  assert.ok(backup.content.startsWith("\uFEFF"));
});

test("conteúdo: cabeçalho, uma linha por sorteio, separador ';', ordenado por quando foi sorteado", () => {
  const { content } = buildRaffleBackup([draw(2, "Beto Lima"), draw(1, "Ana Souza")], { now });
  const lines = content.replace("\uFEFF", "").trim().split("\r\n");
  assert.equal(lines[0], "Prêmio;Nome;Situação;Id do cadastro;Sorteado em");
  assert.equal(lines.length, 3);
  assert.match(lines[1], /^1;Ana Souza;Ganhador;e1;2026-11-28T14:01:00\.000Z$/);
  assert.match(lines[2], /^2;Beto Lima;Ganhador;e2;/);
});

test("situação: ausente aparece como Ausente e sorteio antigo sem status conta como Ganhador", () => {
  const { content } = buildRaffleBackup([draw(1, "Ana", { status: "absent" }), draw(2, "Beto", { status: undefined })], { now });
  assert.match(content, /;Ausente;/);
  assert.match(content, /2;Beto;Ganhador;/);
});

test("sem sorteios: só o cabeçalho", () => {
  const lines = buildRaffleBackup([], { now }).content.replace("\uFEFF", "").trim().split("\r\n");
  assert.equal(lines.length, 1);
});

test("células: aspas, ponto e vírgula e quebra de linha são protegidos; começo de fórmula vira texto", () => {
  assert.equal(csvCell("Maria; Silva"), '"Maria; Silva"');
  assert.equal(csvCell('Ana "Nanda" Souza'), '"Ana ""Nanda"" Souza"');
  assert.equal(csvCell("linha1\nlinha2"), '"linha1\nlinha2"');
  assert.equal(csvCell("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("+55"), "'+55");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(12), "12");
});
