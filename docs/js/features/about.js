/** Feature: blocos de texto institucional ("Sobre"). */
function renderAbout(sections, mountEl) {
  mountEl.innerHTML = sections.map(section => `
    <div class="about-block">
      <h3>${section.title}</h3>
      <p>${section.body}</p>
    </div>`).join("");
}
