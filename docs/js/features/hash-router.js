/**
 * Feature: rotas por hash (`#telao`): a página só troca de seção, nunca recarrega. Hash que não é de nenhuma rota cai na `fallback`. Tudo por parâmetro: `win` (a janela, de mentira nos testes),
 * `routes` (lista de ids) e `fallback`.
 */
function createHashRouter({ win = window, routes, fallback = routes[0] }) {
  const current = () => {
    const id = win.location.hash.replace(/^#/, "");
    return routes.includes(id) ? id : fallback;
  };

  return {
    current,
    go: id => { win.location.hash = id; },
    /** `onChange(id)` roda a cada troca de hash; devolve a função que desliga. */
    listen(onChange) {
      const handler = () => onChange(current());
      win.addEventListener("hashchange", handler);
      return () => win.removeEventListener("hashchange", handler);
    },
  };
}
