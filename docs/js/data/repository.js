/**
 * Fábrica de repository — mesmo padrão pra qualquer dado estático do
 * site (sponsors, time, depoimentos, etc.), parecido com o repository
 * pattern do Android. "Fonte de dados" aqui é só o array/objeto já
 * carregado em memória pelo próprio data/*.js — este site não tem
 * banco nem API (zero-build, sem backend, decisão de arquitetura já
 * travada em PROJECT_CONTEXT.md); o repository existe pra padronizar
 * o *acesso* (getAll() em vez de referenciar a const global direto),
 * não pra esconder uma chamada de rede que não existe.
 *
 * Precisa carregar antes de qualquer outro data/*.js que chame
 * createRepository().
 */
function createRepository(data, extraMethods = {}) {
  return {
    getAll: () => data,
    ...extraMethods,
  };
}
