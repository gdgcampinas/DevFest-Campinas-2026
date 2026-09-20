/**
 * Feature: acessibilidade transversal. Não muda o visual, só como o
 * site se comporta pra teclado, leitor de tela e quem pede menos
 * movimento.
 */
const SKIP_TARGET_ID = "conteudo";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Comportamento de rolagem programática que respeita "reduzir movimento". */
function motionSafeBehavior() {
  return prefersReducedMotion() ? "auto" : "smooth";
}

/**
 * "Pular para o conteúdo": primeiro item na ordem de tabulação, só
 * aparece com foco. O alvo é o primeiro bloco depois do <header>, sem
 * exigir markup novo em nenhuma página.
 */
function initSkipLink({ label = "Pular para o conteúdo" } = {}) {
  const target = document.querySelector("header")?.nextElementSibling;
  if (!target) return;
  target.id = target.id || SKIP_TARGET_ID;
  target.tabIndex = -1;
  const link = document.createElement("a");
  link.className = "skip-link";
  link.href = `#${target.id}`;
  link.textContent = label;
  document.body.prepend(link);
}
