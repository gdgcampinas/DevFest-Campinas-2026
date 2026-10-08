/**
 * Feature: a SESSÃO do admin, o login único da área. Segura o e-mail da conta Google de moderador (o Firebase já guarda esse login entre páginas, então `restore()` entra sozinho quando a pessoa
 * já tinha entrado em outra tela de moderação) e avisa quem escuta quando ele muda. Só o e-mail da lista de moderadores das regras consegue ler e gravar; a sessão não decide permissão (a regra é a
 * defesa, cada seção avisa "sem permissão" quando o banco recusa). Tudo por parâmetro: `login` ({ signIn, restore, signOut }, padrão: defaultModeratorLoginDeps).
 */
function createAdminSession({ login = defaultModeratorLoginDeps() } = {}) {
  let email = "";
  const listeners = new Set();
  const change = next => {
    email = next;
    listeners.forEach(listener => listener(email));
  };

  return {
    email: () => email,
    async restore() {
      change((await login.restore().catch(() => null)) ?? "");
      return email;
    },
    async signIn() {
      change(await login.signIn());
      return email;
    },
    async signOut() {
      await login.signOut();
      change("");
    },
    /** `listener(email)` roda a cada entrada e saída ("" = ninguém); devolve a função que desliga. */
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
