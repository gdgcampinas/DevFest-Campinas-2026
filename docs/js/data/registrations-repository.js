/**
 * Inscritos do Sympla, escritos pelo job DevFestIA/tools/sympla-sync.
 * Id = registrationKey(edição, e-mail) de email-hash.js (só o hash do
 * e-mail, nunca o e-mail). Serve o gate do cartão "Eu vou!".
 */
window.registrationsRepository = window.createPublicLookupRepository({
  db: window.firebaseClient.db,
  collectionName: "registrations",
});
