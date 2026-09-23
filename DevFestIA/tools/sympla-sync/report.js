/** Resumo em Markdown de uma rodada (vai pro painel privado do GitHub Actions). Puro: só formata. */
const rows = (title, counts) => {
  const entries = Object.entries(counts);
  return entries.length ? `\n**${title}**\n\n| | |\n|---|---|\n${entries.map(([name, value]) => `| ${name} | ${value} |`).join("\n")}\n` : "";
};

function formatSummary({ edition, result }) {
  const { stats, upserted, deleted, registrations, dryRun } = result;
  return [
    `## Sympla sync, DevFest ${edition}${dryRun ? " (teste, nada gravado)" : ""}`,
    "",
    `- Inscritos (ingressos aprovados): **${stats.total}**`,
    `- Com check-in no Sympla: **${stats.checkedIn}**`,
    `- Pedidos ou ingressos não aprovados (ignorados): ${stats.notApproved}`,
    `- E-mails liberados no site: ${registrations} (novos ou alterados: ${upserted}, removidos: ${deleted})`,
    rows("Por tipo de ingresso", stats.byTicket),
    rows("Respostas do formulário (camiseta etc.)", stats.formAnswers),
  ].join("\n");
}

module.exports = { formatSummary };
