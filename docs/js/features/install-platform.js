/**
 * Descobre em que plataforma o site está rodando, só para escolher o guia
 * de instalação certo (data/install-guides.js). Puro: recebe o ambiente
 * ({ ua, maxTouchPoints }) por parâmetro, então testa sem navegador.
 * A primeira regra que casar vence; a ordem importa (o Chrome também
 * diz "Safari" no user agent, um app embutido também diz "Android").
 */
const INSTALL_PLATFORM_RULES = [
  { id: "in-app", matches: ({ ua }) => /FBAN|FBAV|Instagram|MicroMessenger|TikTok|Snapchat|Line\/|; wv\)/i.test(ua) },
  { id: "ios-other", matches: env => isIos(env) && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(env.ua) },
  { id: "ios-safari", matches: env => isIos(env) },
  { id: "android-firefox", matches: ({ ua }) => /Android/i.test(ua) && /Firefox/i.test(ua) },
  { id: "android-chromium", matches: ({ ua }) => /Android/i.test(ua) },
  { id: "desktop-firefox", matches: ({ ua }) => /Firefox\//i.test(ua) },
  { id: "desktop-chromium", matches: ({ ua }) => /Chrome\/|Chromium\/|Edg\//i.test(ua) },
  { id: "desktop-safari", matches: ({ ua }) => /Safari\//i.test(ua) },
];

/** iPhone, iPad e o iPad que se apresenta como Mac (tem tela de toque). */
function isIos({ ua, maxTouchPoints = 0 }) {
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);
}

function detectInstallPlatform(env, rules = INSTALL_PLATFORM_RULES) {
  const rule = rules.find(candidate => candidate.matches(env));
  return rule ? rule.id : "generic";
}

/** Já está rodando como app instalado (janela própria, sem barra do navegador). */
function isRunningAsInstalledApp(win = window) {
  const standalone = win.matchMedia && win.matchMedia("(display-mode: standalone)").matches;
  return Boolean(standalone || win.navigator.standalone);
}
