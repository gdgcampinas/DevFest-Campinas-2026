/**
 * Testa o botão de emergência ?nosw=1 no Chrome real: depois de visitar,
 * a página com ?nosw=1 deve deixar 0 service workers e 0 caches. Mesmos
 * requisitos do e2e-offline.js (servidor na porta 8080 ligado).
 */
const { spawn } = require("child_process");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9333", "--user-data-dir=/tmp/sw-e2e-profile", "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
(async () => {
  let targets; for (let i = 0; i < 30; i++) { try { targets = await (await fetch("http://localhost:9333/json/list")).json(); if (targets.length) break; } catch {} await sleep(300); }
  const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
  let id = 0; const pending = new Map(); ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async e => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result.result.value;
  const go = async u => { await send("Page.navigate", { url: u }); await sleep(3500); };
  await send("Page.enable");
  await go("http://localhost:8080/index.html"); await sleep(4000);
  const before = await ev(`(async()=>({regs:(await navigator.serviceWorker.getRegistrations()).length, caches:(await caches.keys()).length}))()`);
  await go("http://localhost:8080/index.html?nosw=1"); await sleep(4000);
  const after = await ev(`(async()=>({regs:(await navigator.serviceWorker.getRegistrations()).length, caches:(await caches.keys()).length, title:document.title}))()`);
  console.log(JSON.stringify({ before, after }));
  ws.close(); chrome.kill(); process.exit(0);
})();
