/**
 * Feature: copiar um texto pra área de transferência com retorno visual
 * no próprio botão. Único lugar que sabe fazer isso (agenda, quiz e o que
 * vier depois reusam); sem permissão de clipboard cai num prompt() pra
 * pessoa copiar na mão. Textos vêm por parâmetro.
 */
async function copyWithFeedback(text, { labelEl, doneText = "Link copiado", idleText = labelEl?.textContent, promptText = "Copie o link:", resetMs = 2000 } = {}) {
  try {
    await navigator.clipboard.writeText(text);
    if (!labelEl) return;
    labelEl.textContent = doneText;
    setTimeout(() => (labelEl.textContent = idleText), resetMs);
  } catch {
    window.prompt(promptText, text);
  }
}
