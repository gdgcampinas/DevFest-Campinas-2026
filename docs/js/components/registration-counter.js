/** "N pessoas já garantiram a vaga": prova social com o total de inscritos (só o número, sem dado pessoal). */
function registrationCounterMarkup({ count }) {
  return `${iconMarkup("users")}<span><strong>${count}</strong> ${count === 1 ? "pessoa já garantiu" : "pessoas já garantiram"} a vaga</span>`;
}
