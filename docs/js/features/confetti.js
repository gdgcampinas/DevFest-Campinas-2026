/**
 * Papel picado na tela (canvas por cima de tudo, sem clique): cria os pedaços (features/confetti-engine.js) e os
 * desenha enquanto houver algum. O canvas só existe durante a animação e some quando acaba. Tudo injetável: janela,
 * relógio, quadro de animação, sorteador, config e paleta (nenhum global fixo), então o teste roda sem navegador de verdade.
 *
 * Enfeite, não função: com "Reduzir movimento" no sistema ele não dispara, a menos que quem chama force (o modo telão,
 * onde a animação faz parte do show). Nunca atrapalha o sorteio: qualquer falha aqui é engolida.
 */

/** Cores da marca lidas dos tokens do site (data/tokens.css); sem token (ex.: teste), as de reserva da config. */
function brandConfettiPalette(config, doc = document, win = window) {
  const styles = win.getComputedStyle(doc.documentElement);
  const colors = config.colorVars.map(name => styles.getPropertyValue(name).trim()).filter(Boolean);
  return colors.length ? colors : config.fallbackColors;
}

function drawConfetti(ctx, particles, bounds, ratio) {
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  for (const particle of particles) {
    if (particle.delay > 0) continue;
    ctx.save();
    ctx.globalAlpha = confettiAlpha(particle);
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.scale(1, Math.cos(particle.wobble)); // o papel vira e desvira
    ctx.fillStyle = particle.color;
    ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
    ctx.restore();
  }
}

function createConfetti({
  doc = document,
  win = window,
  config = raffleConfettiRepository.getAll(),
  random = Math.random,
  now = () => performance.now(),
  requestFrame = callback => win.requestAnimationFrame(callback),
  palette = () => brandConfettiPalette(config, doc, win),
  reducedMotion = () => Boolean(win.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
} = {}) {
  let canvas = null;
  let particles = [];
  let running = false;
  let lastTime = 0;

  const bounds = () => ({ width: win.innerWidth, height: win.innerHeight });

  function open() {
    if (canvas) return;
    canvas = doc.createElement("canvas");
    canvas.className = "raffle-confetti";
    // Estilo no próprio canvas (não numa folha de estilo): o papel picado também roda no quadro da sala, que tem outra folha de estilo.
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2500";
    canvas.setAttribute("aria-hidden", "true");
    doc.body.appendChild(canvas);
  }

  function close() {
    canvas?.remove();
    canvas = null;
    particles = [];
    running = false;
  }

  function frame(time) {
    if (!canvas) return;
    try {
      paint(time);
    } catch {
      close(); // sem contexto 2D ou qualquer falha de desenho: o enfeite some, o sorteio segue
    }
  }

  function paint(time) {
    const size = bounds();
    const ratio = win.devicePixelRatio || 1;
    if (canvas.width !== Math.round(size.width * ratio) || canvas.height !== Math.round(size.height * ratio)) {
      canvas.width = Math.round(size.width * ratio);
      canvas.height = Math.round(size.height * ratio);
    }
    const dt = Math.min((time - lastTime) / 1000, 0.05); // um quadro perdido não vira um salto na física
    lastTime = time;
    particles = stepConfetti(particles, dt, { config, bounds: size });
    drawConfetti(canvas.getContext("2d"), particles, size, ratio);
    if (particles.length) requestFrame(frame);
    else close();
  }

  /**
   * Dispara um papel picado. `origin` = { x, y } da explosão (sem ele, só a chuva). `force` ignora "Reduzir movimento".
   * Devolve se disparou.
   */
  function fire({ origin = null, force = false } = {}) {
    if (!force && reducedMotion()) return false;
    try {
      open();
      particles = particles.concat(createConfettiBatch({ origin, bounds: bounds(), random, config, palette: palette() }));
      if (!running) {
        running = true;
        lastTime = now();
        requestFrame(frame);
      }
      return true;
    } catch {
      close();
      return false;
    }
  }

  return { fire, clear: close };
}
