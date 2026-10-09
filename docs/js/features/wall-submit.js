/**
 * Feature: a página de enviar RECADO pro telão (recado.html). A pessoa escolhe a pergunta, escreve em até `config.maxLength` caracteres (apelido opcional) e envia: o recado vai pro Firestore como
 * `pending` e só aparece no telão depois que o moderador aprova. Cada aparelho manda até `config.maxPerPerson` (os espaços já usados vêm do banco, então recarregar a página não zera o limite).
 * Antes de enviar passa pelo filtro de primeira linha (features/wall-text.js: palavra ofensiva, link, e-mail, telefone). Erro nunca apaga o que a pessoa digitou; o botão não envia duas vezes.
 * Tudo por parâmetro: `repository` ({ add(uid, entryKey, data), getMineFor(uid, entryKeys) }), `config` (data/wall-config.js), `rules` ({ validateWallPost, nextWallSlot, wallEntry }), `getUid()`, `text` (as frases da tela,
 * data/wall-texts.js). Devolve `{ stop }`.
 */
function initWallSubmit(rootEl, { repository, config, rules, getUid, text }) {
  const used = new Set();
  let uid = null;
  let stopped = false;
  let sending = false;
  const slots = Array.from({ length: config.maxPerPerson }, (_, index) => `wall-${index + 1}`);
  const remaining = () => config.maxPerPerson - used.size;
  const field = attr => rootEl.querySelector(`[${attr}]`);
  const setSlot = (name, markup) => { const slot = rootEl.querySelector(`[data-slot="${name}"]`); if (slot) slot.innerHTML = markup; };
  const showState = (state, extra = {}) => { if (!stopped) rootEl.innerHTML = wallStateMarkup({ state, text, ...extra }); };

  function showForm() {
    if (stopped) return;
    rootEl.innerHTML = wallSubmitShellMarkup({ config, text });
    drawCount();
  }
  function drawCount() {
    const length = field("data-wall-text")?.value.length ?? 0;
    setSlot("count", `${length}/${config.maxLength}`);
  }

  async function start() {
    showState("loading");
    if (!config.open) return showState("closed");
    try {
      uid = await getUid();
      (await repository.getMineFor(uid, slots)).forEach(key => used.add(Number(key.split("-")[1])));
    } catch {
      return showState("closed"); // sem login ou sem leitura não dá pra garantir o limite: não deixa enviar
    }
    if (remaining() <= 0) return showState("limit");
    showForm();
  }

  rootEl.addEventListener("input", event => {
    if (event.target.matches("[data-wall-text]")) drawCount();
    if (event.target.matches("[data-wall-prompt]")) field("data-wall-text").placeholder = config.prompts.find(prompt => prompt.id === event.target.value).placeholder;
  });

  rootEl.addEventListener("click", event => {
    if (event.target.closest("[data-wall-again]")) showForm();
  });

  rootEl.addEventListener("submit", async event => {
    const form = event.target.closest("[data-wall-form]");
    if (!form) return;
    event.preventDefault();
    if (sending) return;
    let post;
    try {
      post = rules.validateWallPost({ text: field("data-wall-text").value, nickname: field("data-wall-nickname").value, prompt: form.querySelector("[data-wall-prompt]:checked")?.value }, config);
    } catch (error) {
      return setSlot("message", wallMessageMarkup(`${error.message[0].toUpperCase()}${error.message.slice(1)}.`));
    }
    sending = true;
    field("data-wall-send").disabled = true;
    setSlot("message", "");
    const slot = rules.nextWallSlot(used, config.maxPerPerson);
    try {
      const entry = rules.wallEntry(post, slot);
      await repository.add(uid, entry.entryKey, entry);
      used.add(slot);
      showState("sent", { remaining: remaining() });
    } catch {
      field("data-wall-send").disabled = false;
      setSlot("message", wallMessageMarkup(text.failed));
    }
    sending = false;
  });

  start();
  return { stop: () => { stopped = true; } };
}
