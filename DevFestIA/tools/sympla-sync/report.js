/** Resumo em Markdown de uma rodada (vai pro resumo do GitHub Actions, que é PÚBLICO neste repositório: só números agregados, nunca dado pessoal). Puro: só formata. */
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
    rows("Respostas de camiseta", stats.formAnswers),
  ].join("\n");
}

module.exports = { formatSummary };
