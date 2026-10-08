/**
 * Confirmação em DOIS TOQUES, sem `confirm()` do navegador (que no celular e no modo quiosque atrapalha): o 1º toque ARMA uma chave (um botão, um item) por `confirmMs`; o 2º toque na MESMA chave
 * dentro do prazo executa a ação. Armar outra chave troca a armada; passado o prazo, desarma sozinho. `onChange(chave | null)` avisa a tela pra redesenhar ("Toque de novo pra CONFIRMAR").
 * Usada pela emergência do telão, pela remoção de moderador e pela limpeza do aparelho (uma regra só). Tudo por parâmetro: `schedule` (agendador, de mentira nos testes), `confirmMs`, `onChange`.
 */
function createTwoTapConfirm({ schedule = defaultSchedule, confirmMs = 5000, onChange = () => {} } = {}) {
  let armed = null;
  let cancel = () => {};

  const disarm = () => {
    cancel();
    cancel = () => {};
    if (armed !== null) {
      armed = null;
      onChange(null);
    }
  };

  return {
    armed: () => armed,
    disarm,
    /** Devolve o que `action` devolver no 2º toque; no 1º toque só arma (devolve undefined). */
    press(key, action) {
      if (armed === key) {
        disarm();
        return action();
      }
      cancel();
      armed = key;
      onChange(key);
      cancel = schedule(() => {
        cancel = () => {};
        armed = null;
        onChange(null);
      }, confirmMs);
      return undefined;
    },
  };
}
