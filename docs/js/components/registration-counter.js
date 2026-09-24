/** "N pessoas já garantiram a vaga": prova social com o total de inscritos (só o número, sem dado pessoal). */
function registrationCounterMarkup({ count }) {
  return `${iconMarkup("users")}<span>${tn("counter", count, "<strong>{count}</strong> pessoa já garantiu a vaga", "<strong>{count}</strong> pessoas já garantiram a vaga")}</span>`;
}
