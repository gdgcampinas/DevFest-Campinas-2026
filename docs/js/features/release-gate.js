/**
 * A regra única de "liberado só em DEV até `public: true`": uma coisa nova (página, guia, local) nasce com `public: false` e aparece só no modo DEV pra conferir; `public: true` libera em produção.
 * Dual (navegador e Node).
 */
const isReleased = (config, { devMode = false } = {}) => Boolean(config?.public || devMode);

if (typeof module !== "undefined") module.exports = { isReleased };
