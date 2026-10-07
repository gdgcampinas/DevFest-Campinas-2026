/** Carrega os arquivos "dual" do site no Node e deixa as dependências globais (como no navegador, onde cada arquivo é um <script>). */
const path = require("node:path");
const JS = path.join(__dirname, "..", "..", "..", "docs", "js");
const load = file => require(path.join(JS, file));

const { backoffDelay } = load("features/backoff.js");
globalThis.backoffDelay = backoffDelay;

module.exports = { load, backoffDelay };
