/**
 * Testa as perguntas do mural de recados que nascem só no modo DEV (data/wall-config.js): a plateia só vê as liberadas, o modo DEV vê todas
 * e a cena da pergunta nova no telão fica ligada ou desligada pela mesma chave.
 *   node --test DevFestIA/tools/mural/wall-prompts.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const data = file => fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs", "js", "data", file), "utf8");
const { repository, config } = vm.runInNewContext(`${data("repository.js")}\n${data("wall-config.js")}\n({ repository: wallConfigRepository, config: WALL_CONFIG })`);
const ids = list => Array.from(list, prompt => prompt.id);

test("a pergunta nova (primeiro DevFest) está liberada em PROD: a plateia a vê junto com as outras", () => {
  assert.ok(config.prompts.some(prompt => prompt.id === "primeiro-devfest" && prompt.public !== false));
  assert.deepEqual(ids(repository.visiblePrompts()), ["buscar", "recado", "significou", "primeiro-devfest"]);
  assert.deepEqual(ids(repository.visiblePrompts({ devMode: false })), ["buscar", "recado", "significou", "primeiro-devfest"]);
});

test("a regra de liberação: pergunta com `public: false` só aparece no modo DEV", () => {
  const prompt = config.prompts.find(item => item.id === "primeiro-devfest");
  prompt.public = false;
  try {
    assert.deepEqual(ids(repository.visiblePrompts({ devMode: false })), ["buscar", "recado", "significou"]);
    assert.deepEqual(ids(repository.visiblePrompts({ devMode: true })), ["buscar", "recado", "significou", "primeiro-devfest"]);
    assert.equal(repository.promptPublic("primeiro-devfest"), false);
  } finally {
    delete prompt.public;
  }
});

test("pergunta sem `public` conta como liberada; `public: false` e id que não existe, não", () => {
  assert.equal(repository.promptPublic("buscar"), true);
  assert.equal(repository.promptPublic("primeiro-devfest"), true, "a nova está liberada");
  assert.equal(repository.promptPublic("nao-existe"), false);
});

test("a cena da pergunta nova no telão liga e desliga pela mesma chave, e a pergunta cabe no limite das regras (41 caracteres no id)", () => {
  assert.match(data("mural-scenes.js"), /id: "recados-primeiro-devfest"[^\n]*enabled: wallConfigRepository\.promptPublic\("primeiro-devfest"\)[^\n]*params: \{ prompt: "primeiro-devfest" \}/);
  config.prompts.forEach(prompt => assert.ok(prompt.id.length < 41, `${prompt.id} passa do limite do campo prompt nas regras`));
});
