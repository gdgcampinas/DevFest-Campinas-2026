/**
 * Organizadores/voluntários do DevFest Campinas 2026 — MOCK abaixo
 * até confirmar nomes/fotos reais. `type` distingue organizador de
 * voluntário (mesmo grid/card, só filtra em 2 seções na página Time).
 * `social` aceita qualquer rede — cada item vira 1 ícone. Fotos e
 * links mock vêm de mock-photo.js e mock-links.js.
 */
const socialLinks = {
  linkedin: { name: "linkedin", link: MOCK_LINKEDIN_URL },
  facebook: { name: "facebook", link: MOCK_FACEBOOK_URL },
};

const member = (type, name, role, photoId, networks = ["linkedin"]) => ({
  name,
  role,
  type,
  photo: mockPhoto(photoId),
  social: networks.map(network => socialLinks[network]),
});

const TEAM = [
  member("organizador", "Fernanda Albuquerque", "Direção Geral", 47, ["facebook", "linkedin"]),
  member("organizador", "Rodrigo Menezes", "Curadoria de Conteúdo", 66),
  member("organizador", "Patrícia Lacerda", "Comunicação e Marketing", 48, ["facebook", "linkedin"]),
  member("organizador", "Bruno Cavalcanti", "Parcerias e Patrocínio", 63),
  member("organizador", "Tatiane Moraes", "Operações e Logística", 49),
  member("organizador", "Felipe Nascimento", "Tecnologia e Site", 68),
  member("voluntario", "Luana Vasconcelos", "Voluntária", 9),
  member("voluntario", "Gustavo Peixoto", "Voluntário", 7),
  member("voluntario", "Isadora Campos", "Voluntária", 43),
  member("voluntario", "Diego Fontes", "Voluntário", 56),
  member("voluntario", "Sérgio Tavares", "Voluntário", 70),
  member("voluntario", "Bianca Moreira", "Voluntária", 40),
  member("voluntario", "Heitor Barros", "Voluntário", 69),
  member("voluntario", "Anderson Salles", "Voluntário", 61),
];

const teamRepository = createRepository(TEAM, {
  getByType: type => TEAM.filter(person => person.type === type),
});
