/**
 * Feature: app instalável e uso offline. Registra o service worker
 * (sw.js), mostra o botão "Instalar app" quando o navegador oferece, e
 * avisa quando a pessoa fica sem internet. Botão de emergência: abrir
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

function initOfflineNotice({ message = "Você está sem internet. Mostrando a versão salva no aparelho." } = {}) {
  const bar = document.createElement("div");
  bar.className = "offline-bar";
  bar.setAttribute("role", "status");
  bar.textContent = message;
  bar.hidden = navigator.onLine;
  document.body.appendChild(bar);
  window.addEventListener("online", () => (bar.hidden = true));
  window.addEventListener("offline", () => (bar.hidden = false));
}

/** Guarda o evento do navegador e mostra o botão "Instalar app" no cabeçalho. */
function initInstallPrompt({ mountEl, label = "Instalar app" }) {
  let deferred = null;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferred = event;
    mountEl.insertAdjacentHTML("afterbegin", `<button type="button" class="chip-btn" data-install data-track-event="pwa_install">${iconMarkup("download")}${label}</button>`);
  });
  mountEl.addEventListener("click", async event => {
    if (!event.target.closest("[data-install]") || !deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    mountEl.querySelector("[data-install]")?.remove();
  });
  window.addEventListener("appinstalled", () => mountEl.querySelector("[data-install]")?.remove());
}

function initPwa() {
  initOfflineNotice();
  if (!canUseServiceWorker()) return;
  if (getParam("nosw") === "1") {
    killServiceWorker();
    return;
  }
  window.addEventListener("load", () => navigator.serviceWorker.register(SW_PATH).catch(() => {}));
  const actionsEl = document.querySelector(".header-actions");
  if (actionsEl) initInstallPrompt({ mountEl: actionsEl });
}
