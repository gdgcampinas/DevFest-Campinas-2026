/**
 * Inscrições já verificadas neste navegador (só a chave = hash do e-mail
 * + edição, nunca o e-mail), pra não pedir o e-mail de novo. Persistido
 * no localStorage; trocar o storage é editar só esta linha.
 */
const verifiedRegistrationsRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:verified-registrations" });
