/**
 * Lista dos sorteios feitos em CSV (puro, DUAL, testado em Node): é o que o site baixa ANTES de apagar tudo no reset de
 * emergência, pra a organização não perder quem ganhou, quem não estava na sala e em que ordem. Separador ";" e BOM UTF-8:
 * o Excel em português abre direto, com acento certo. Relógio e fuso entram por parâmetro (nada fixo).
 */
const RAFFLE_BACKUP_HEADER = ["Prêmio", "Nome", "Situação", "Id do cadastro", "Sorteado em"];
const RAFFLE_BACKUP_STATUS = { winner: "Ganhador", absent: "Ausente" };

/** Célula segura: aspas dobradas e entre aspas se tiver ; " ou quebra de linha (e sem "=+-@" no começo, que vira fórmula na planilha). */
function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildRaffleBackup(draws, { now = new Date() } = {}) {
  const rows = draws
    .slice()
    .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0) || a.prize - b.prize)
    .map(item => [item.prize, item.name, RAFFLE_BACKUP_STATUS[item.status ?? "winner"] ?? item.status, item.entryId, item.createdAtMs ? new Date(item.createdAtMs).toISOString() : ""]);
  const content = "\uFEFF" + [RAFFLE_BACKUP_HEADER, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
  const stamp = now.toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return { filename: `sorteio-backup-${stamp}.csv`, mimeType: "text/csv;charset=utf-8", content };
}

if (typeof module !== "undefined") module.exports = { buildRaffleBackup, csvCell, RAFFLE_BACKUP_HEADER };
