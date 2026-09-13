/** Página: Código de Conduta (features/cod.js). */
function initCodPage() {
  initShell("cod");
  renderCod(codRepository.getAll(), document.getElementById("codSection"));
}

initCodPage();
