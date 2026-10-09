/**
 * Feature: o que a conta logada pode USAR no admin, pra o menu esconder o que ela não usa. Não repete nenhum e-mail no código: tenta ler a lista de moderadores (`probe`), que só o DONO consegue
 * pelas regras do Firestore. Leu = dono; "sem permissão" = moderador comum; outro erro (rede) = não sabe (`owner: null`) e o menu mostra tudo. Esconder do menu é conforto: quem decide mesmo é a regra.
 * `resolveAdminAccess({ probe })` devolve { owner: true | false | null }; `visibleSections(sections, access)` filtra as seções `ownerOnly` de quem sabidamente não é dono.
 */
async function resolveAdminAccess({ probe }) {
  try {
    await probe();
    return { owner: true };
  } catch (error) {
    return { owner: error?.code === "permission-denied" ? false : null };
  }
}

const visibleSections = (sections, access) => sections.filter(section => !section.ownerOnly || access.owner !== false);
