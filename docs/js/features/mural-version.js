/**
 * Versão nova publicada com o mural aberto: o telão fica ligado o dia inteiro e o site pode ser atualizado no meio do evento. O mural
 * relê o próprio HTML de tempos em tempos e compara a "assinatura" dos arquivos que ele carrega (todos têm ?v=N: mudou o N, mudou o arquivo).
 * Mudança = pede recarga na próxima troca de cena (features/mural-health.js, motivo "version"). Dual (navegador e Node).
 */
function assetSignature(html) {
  const found = [...String(html).matchAll(/(?:src|href)=(?:"|&quot;)([^"&\s]+\?v=\d+)/g)].map(match => match[1]);
  return [...new Set(found)].sort().join("|");
}

/**
 * `fetchText()` devolve o HTML mais novo (ou rejeita sem rede). A primeira leitura vira a base; as seguintes comparam.
 * Falha de rede não é mudança de versão: só tenta de novo na próxima.
 */
function createVersionChecker({ fetchText, onChange }) {
  let baseline = null;
  return {
    async check() {
      try {
        const signature = assetSignature(await fetchText());
        if (baseline === null) baseline = signature;
        else if (signature !== baseline) onChange(signature);
      } catch {
        /* sem rede agora: tenta de novo depois */
      }
    },
  };
}

if (typeof module !== "undefined") module.exports = { assetSignature, createVersionChecker };
