/**
 * Feature: o que a conta logada pode USAR no admin. Duas perguntas, as duas ao banco (sem repetir nenhum e-mail no código): é MODERADORA? (features/moderator-access.js: uma leitura que só moderador
 * consegue; quem não é fica na tela de bloqueio) e é o DONO? (tenta ler a lista de moderadores, que só o dono consegue pelas regras; o menu esconde o que só o dono usa). Quem decide é a regra do Firestore;
 * a tela barra a entrada e esconde do menu. `resolveAdminAccess({ probe, probeModerator })` devolve { owner, moderator }, cada um true | false | null (null = não deu pra saber, rede): o dono é moderador;
 * `visibleSections(sections, access)` filtra as seções `ownerOnly` de quem sabidamente não é dono.
 */
async function resolveAdminAccess({ probe, probeModerator }) {
  const owner = await probeAllowed(probe);
  if (owner === true) return { owner: true, moderator: true };
  return { owner, moderator: await probeAllowed(probeModerator) };
}

const visibleSections = (sections, access) => sections.filter(section => !section.ownerOnly || access.owner !== false);
