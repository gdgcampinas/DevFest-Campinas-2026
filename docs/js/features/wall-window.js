/**
 * A JANELA do mural de recados (regra PURA, dual: navegador e Node, testada em DevFestIA/tools/mural/wall-window.test.js): o envio só vale no dia do evento, de `window.from` até `window.until`
 * (data/wall-config.js: ISO com fuso). `wallPhase` devolve "before" (ainda não abriu), "open" ou "closed" (já fechou); `open: false` no config fecha na hora, seja qual for o relógio (interruptor manual).
 * Usada pela página de recados, pelo cartão da home, pelo convite depois da avaliação e pelo QR do telão (uma regra só).
 */
function wallPhase(now, config) {
  if (config.open === false) return "closed";
  const time = now.getTime();
  if (time < Date.parse(config.window.from)) return "before";
  if (time >= Date.parse(config.window.until)) return "closed";
  return "open";
}

if (typeof module !== "undefined") module.exports = { wallPhase };
