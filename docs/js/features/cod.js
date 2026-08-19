/**
 * Feature: seção de código de conduta. Renderiza 100% a partir de
 * CODE_OF_CONDUCT (js/data/cod.js) — trocar o texto não toca aqui.
 */
function renderCod(cod, mountEl) {
  const contacts = cod.contacts.length
    ? `<p class="cod-contacts">Contato: ${cod.contacts.map(c => `${c.name} (${c.contact})`).join(" · ")}</p>`
    : "";
  mountEl.innerHTML = `
    <h2>${cod.title}</h2>
    <p class="cod-intro">${cod.intro}</p>
    <ul class="cod-rules">${cod.rules.map(rule => `<li>${rule}</li>`).join("")}</ul>
    ${contacts}`;
}
