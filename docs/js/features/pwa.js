/**
 * Feature: app instalável e uso offline. Registra o service worker
 * (sw.js), mostra o botão "Instalar app" (nativo ou com o guia da
 * plataforma) e avisa quando a pessoa fica sem internet. Botão de emergência: abrir
 * qualquer página com ?nosw=1 remove o service worker e os caches.
 */
const SW_PATH = "sw.js";

async function removeServiceWorker() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(registration => registration.unregister()));
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith("devfest-shell-")).map(name => caches.delete(name)));
}

/**
 * Botão de emergência (?nosw=1): remove o service worker e os caches. O
 * worker antigo ainda controla esta página e pode repopular o cache
 * durante o carregamento, então recarrega uma vez pra soltar o controle
 * e limpa de novo (a segunda passada roda sem worker).
 */
async function killServiceWorker() {
  await removeServiceWorker();
  const flag = "devfest-nosw-reloaded";
  try {
    if (navigator.serviceWorker.controller && !sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "1");
      location.reload();
    }
  } catch {
    /* sem sessionStorage: a limpeza já foi feita */
  }
}

function canUseServiceWorker() {
  return "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost");
}

function initOfflineNotice({ message = t("pwa.offline", "Você está sem internet. Mostrando a versão salva no aparelho.") } = {}) {
  const bar = document.createElement("div");
  bar.className = "offline-bar";
  bar.setAttribute("role", "status");
  bar.textContent = message;
  bar.hidden = navigator.onLine;
  document.body.appendChild(bar);
  window.addEventListener("online", () => (bar.hidden = true));
  window.addEventListener("offline", () => (bar.hidden = false));
}

/**
 * Botão "Instalar app" no cabeçalho, sempre presente enquanto o app não
 * está instalado. Com o evento nativo (Chrome, Edge, Android) abre o
 * diálogo do navegador; sem ele (iPhone, Firefox, app embutido) abre o
 * guia de instalação da plataforma. Tudo entra por parâmetro: onde
 * montar, qual plataforma, de onde vêm os guias e como abrir o modal.
 */
function initInstallPrompt({ mountEl, platform, guides, createGuideModal, label = t("pwa.install", "Instalar app") }) {
  if (isRunningAsInstalledApp()) return;
  mountEl.insertAdjacentHTML("afterbegin", `<button type="button" class="chip-btn" data-install data-track-event="pwa_install" data-track-kind="guide">${iconMarkup("download")}${label}</button>`);
  const buttonEl = mountEl.querySelector("[data-install]");
  let deferred = null;
  let guideModal = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferred = event;
    buttonEl.dataset.trackKind = "native";
  });
  window.addEventListener("appinstalled", () => buttonEl.remove());

  buttonEl.addEventListener("click", async () => {
    if (deferred) {
      const promptEvent = deferred;
      deferred = null;
      buttonEl.dataset.trackKind = "guide";
      promptEvent.prompt();
      await promptEvent.userChoice;
      return;
    }
    guideModal = guideModal || createGuideModal();
    guideModal.openHTML(installGuideMarkup(guides.getByPlatform(platform)));
  });
}

function initPwa() {
  initOfflineNotice();
  if (canUseServiceWorker()) {
    if (getParam("nosw") === "1") {
      killServiceWorker();
      return;
    }
    window.addEventListener("load", () => navigator.serviceWorker.register(SW_PATH).catch(() => {}));
  }
  const actionsEl = document.querySelector(".header-actions");
  if (actionsEl) {
    initInstallPrompt({
      mountEl: actionsEl,
      platform: detectInstallPlatform({ ua: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints }),
      guides: installGuidesRepository,
      createGuideModal: () => createModal("installModal", { label: t("pwa.guideLabel", "Como instalar o app") }),
    });
  }
}
