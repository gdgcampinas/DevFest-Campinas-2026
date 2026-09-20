/**
 * Teste ponta a ponta do service worker no Chrome REAL (o painel do app
 * não roda service worker). Precisa de um servidor em http://localhost:8080
 * servindo docs/ (cd docs && python3 -m http.server 8080) e do Chrome do
 * macOS. Registra, confere o precache, DESLIGA o servidor (pkill) e prova
 * que home, grade, ?agenda=, palestrantes e página inexistente carregam
 * offline. Para testar produção sem schedule.dev.js, mover o arquivo antes.
 *   rm -rf /tmp/sw-e2e-profile && node DevFestIA/tools/e2e-offline.js
 */
// Teste ponta a ponta do service worker com o Chrome real (CDP). Uso: node sw-e2e.js <pid-do-servidor>
const { spawn, execSync } = require("child_process");
const serverPid = process.argv[2];
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9333", "--user-data-dir=/tmp/sw-e2e-profile", "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
(async () => {
  let targets;
  for (let i = 0; i < 30; i++) { try { targets = await (await fetch("http://localhost:9333/json/list")).json(); if (targets.length) break; } catch {} await sleep(300); }
  const page = targets.find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  const evalJs = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result; };
  const go = async url => { await send("Page.navigate", { url }); await sleep(3500); };
  await send("Page.enable"); await send("Runtime.enable");
  const results = {};

  // 1) primeira visita online: registra e faz o precache
  await go("http://localhost:8080/index.html");
  await sleep(4000);
  results.online = await evalJs(`(async()=>{const r=await navigator.serviceWorker.getRegistration(); const names=await caches.keys(); const c=names.length?await (await caches.open(names[0])).keys():[]; const paths=c.map(k=>new URL(k.url).pathname); return {registered:!!r, scope:r&&r.scope, state:r&&r.active&&r.active.state, caches:names, entries:paths.length, pages:paths.filter(p=>p.endsWith('.html')).length, font:paths.some(p=>p.includes('google-sans')), manifest:paths.includes('/manifest.webmanifest'), icons:paths.filter(p=>p.includes('icon-')), schedule:paths.filter(p=>p.includes('schedule')), css:paths.filter(p=>p.endsWith('.css')).length, js:paths.filter(p=>p.endsWith('.js')).length}})()`);
  // recarrega já controlado pelo SW
  await go("http://localhost:8080/index.html");
  results.controlled = await evalJs("!!navigator.serviceWorker.controller");

  // 2) servidor desligado = offline
  execSync("pkill -f \"http.server 8080\""); await sleep(800);
  await go("http://localhost:8080/index.html");
  results.offlineHome = await evalJs(`({title:document.title, cards:document.querySelectorAll('.faq-item').length, hero:!!document.querySelector('#hero').innerText, tickets:document.querySelectorAll('.ticket').length, sponsors:document.querySelectorAll('.sponsor-item').length, font:document.fonts.check('700 16px "Google Sans"')})`);
  await go("http://localhost:8080/grade.html");
  results.offlineGrade = await evalJs(`({title:document.title, talks:document.querySelectorAll('#agenda .talk').length, fonts:[...document.fonts].map(f=>f.status).join()})`);
  await go("http://localhost:8080/grade.html?agenda=0900.ia,1030.webdata&demo=2026-11-28T09:20");
  results.offlineGradeQuery = await evalJs(`({talks:document.querySelectorAll('#agenda .talk').length, banner:!document.getElementById('sharedAgendaBanner').hidden, offlineBar:!document.querySelector('.offline-bar').hidden})`);
  await go("http://localhost:8080/palestrantes.html");
  results.offlinePalestrantes = await evalJs(`({cards:document.querySelectorAll('.speaker-card').length})`);
  await go("http://localhost:8080/pagina-que-nao-existe.html");
  results.offlineUnknown = await evalJs(`({title:document.title})`);

  console.log(JSON.stringify(results, null, 1));
  ws.close(); chrome.kill();
  process.exit(0);
})().catch(e => { console.error("ERRO", e); chrome.kill(); process.exit(1); });
