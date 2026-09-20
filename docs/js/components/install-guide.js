/** Conteúdo do modal "como instalar": título e passos vêm do guia (data/install-guides.js). */
function installGuideMarkup(guide) {
  return `<div class="install-guide">
    <h3 class="install-guide-title">${iconMarkup("download")}${guide.title}</h3>
    <ol class="install-guide-steps">${guide.steps.map(step => `<li>${step}</li>`).join("")}</ol>
  </div>`;
}
