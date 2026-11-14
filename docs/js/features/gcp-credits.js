/**
 * Feature: página "Créditos do Google Cloud". Renderiza 100% a partir de GCP_CREDITS (data/gcp-credits.js): intro com a sessão, o link que está valendo
 * AGORA (features/gcp-credit-window.js decide pelo horário; `now` e `locale` entram por parâmetro), os requisitos (reusa components/info-card.js),
 * o passo a passo com telas (components/credit-steps.js) e os materiais oficiais do Google.
 */
function creditStateDate(state, { locale }) {
  const iso = state.state === "before" ? state.window.start : state.window?.end;
  return iso ? formatCreditMoment(iso, { locale }) : "";
}

/** `session`: a sessão paralela dos créditos (data/parallel-sessions.js, `config.sessionId`); `host`: quem faz o lab (features/parallel-sessions.js, `resolveParallelHost`) e `parallelTexts` as frases do bloco dele; tudo por parâmetro. */
function renderGcpCredits(config, mountEl, { session, host = null, parallelTexts = null, now = new Date(), locale = "pt-BR" } = {}) {
  const { texts } = config;
  const state = creditWindowState(config.windows, now);
  mountEl.innerHTML = `
    <div class="credit-hero" style="--band-color:${session.color}">
      <div class="credit-hero-main">
        <span class="credit-kicker">${session.kicker}</span>
        <h2>${texts.title}</h2>
        <p>${texts.intro}</p>
        <ul class="credit-session">
          <li>${iconMarkup("trophy")}${session.name}</li>
          <li>${iconMarkup("pin")}${session.place}</li>
          ${parallelRoundLines(session, texts.roundLine).map(line => `<li>${iconMarkup("clock")}${line}</li>`).join("")}
        </ul>
      </div>
      ${host ? parallelHostMarkup(host, parallelTexts) : ""}
    </div>
    <section class="credit-link" aria-labelledby="creditLinkTitle" id="creditLink">
      <h2 id="creditLinkTitle">${texts.linkTitle}</h2>
      ${creditLinkMarkup({ state, texts, dateText: creditStateDate(state, { locale }) })}
    </section>
    <section class="credit-block" aria-labelledby="creditReqTitle">
      <h2 id="creditReqTitle">${texts.requirementsTitle}</h2>
      <div class="faq-grid" id="creditRequirements"></div>
    </section>
    <section class="credit-block" aria-labelledby="creditStepsTitle">
      <h2 id="creditStepsTitle">${texts.stepsTitle}</h2>
      ${creditStepsMarkup(config.steps, { zoomHint: texts.zoomHint })}
      <p class="credit-note">${texts.stepsNote}</p>
      <a class="cta cta--ghost credit-back" href="#creditLink">${texts.toLink}</a>
    </section>
    <section class="credit-block credit-official" aria-labelledby="creditOfficialTitle">
      <h2 id="creditOfficialTitle">${texts.officialTitle}</h2>
      <div class="social-links">
        <a href="${config.officialGuide.url}" target="_blank" rel="noopener">${config.officialGuide.label}</a>
        <a href="${config.faq.url}" target="_blank" rel="noopener">${config.faq.label}</a>
      </div>
    </section>`;
  renderInfoCards(config.requirements.map(item => ({ ...item, id: item.title, icon: iconMarkup(item.icon) })), mountEl.querySelector("#creditRequirements"));
}

/** Card de "Antes de vir" (components/info-card.js) que leva à página; `null` quando a página ainda não é pública e a pessoa não está no modo DEV. */
function gcpCreditsInfoCard(config, { devMode }) {
  if (!config.public && !devMode) return null;
  return { id: "credits", trackColor: "var(--google-green)", icon: iconMarkup("gift"), title: config.texts.title, body: config.texts.creditsCard, href: "creditos.html", linkText: config.texts.creditsLink };
}
