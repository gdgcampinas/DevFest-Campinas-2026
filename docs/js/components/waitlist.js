/**
 * Marcação do cartão da lista de espera dos ingressos (home e página Ingressos): a faixa "Ingressos em breve", o título, os 3 passos e o botão que abre o formulário; o formulário (nome e e-mail
 * com a frase de privacidade) e os estados depois do envio. Só texto escapado e classes de css/waitlist.css; os hooks são `data-*` (features/waitlist.js). Tudo vem de `text` (data/waitlist-texts.js).
 */
function waitlistStepsMarkup(steps) {
  return `<ol class="wl-steps">${steps.map((step, index) => `<li class="wl-step"><span class="wl-step-n">${index + 1}</span>${escapeHtml(step)}</li>`).join("")}</ol>`;
}

function waitlistCardMarkup({ text }) {
  return `
    <div class="wl-card">
      <div class="wl-head">
        <span class="wl-icon" aria-hidden="true">${iconMarkup("star")}</span>
        <div>
          <span class="wl-badge">${escapeHtml(text.badge)}</span>
          <h2 class="wl-title">${escapeHtml(text.title)}</h2>
          <p class="wl-intro">${escapeHtml(text.intro)}</p>
        </div>
      </div>
      ${waitlistStepsMarkup(text.steps)}
      <div class="wl-open"><button type="button" class="cta" data-waitlist-open data-track-event="waitlist_open">${escapeHtml(text.openButton)}</button></div>
      <div class="wl-panel" data-slot="panel" hidden></div>
    </div>`;
}

function waitlistFormMarkup({ text, contactEmail = "", values = {}, errorField = "", message = "" }) {
  const invalid = field => (errorField === field ? ' aria-invalid="true"' : "");
  const leave = contactEmail ? `<p class="wl-privacy-leave">${escapeHtml(text.leave.replace("{email}", contactEmail))}</p>` : "";
  return `
    <form class="wl-form" data-waitlist-form novalidate>
      <h3 class="wl-form-title">${escapeHtml(text.formTitle)}</h3>
      <p class="wl-form-intro">${escapeHtml(text.formIntro)}</p>
      <label class="wl-field"><span>${escapeHtml(text.nameLabel)}</span>
        <input type="text" name="name" autocomplete="name" maxlength="80" placeholder="${escapeHtml(text.namePlaceholder)}" value="${escapeHtml(values.name ?? "")}" data-waitlist-name${invalid("name")}></label>
      <label class="wl-field"><span>${escapeHtml(text.emailLabel)}</span>
        <input type="email" name="email" autocomplete="email" inputmode="email" maxlength="120" placeholder="${escapeHtml(text.emailPlaceholder)}" value="${escapeHtml(values.email ?? "")}" data-waitlist-email${invalid("email")}></label>
      <p class="wl-message" role="alert" data-slot="message">${escapeHtml(message)}</p>
      <p class="wl-privacy">${escapeHtml(text.privacy)}</p>${leave}
      <button type="submit" class="cta cta--block" data-waitlist-submit data-track-event="waitlist_submit">${escapeHtml(text.submit)}</button>
    </form>`;
}

/** Depois do envio: `done` (entrou agora) ou `already` (o aparelho já estava na lista). */
function waitlistResultMarkup({ text, state }) {
  const title = state === "already" ? text.alreadyTitle : text.doneTitle;
  const body = state === "already" ? text.alreadyBody : text.doneBody;
  return `
    <div class="wl-result" role="status">
      <span class="wl-result-icon" aria-hidden="true">${iconMarkup("check")}</span>
      <div><p class="wl-result-title">${escapeHtml(title)}</p><p class="wl-result-body">${escapeHtml(body)}</p></div>
    </div>`;
}
