/**
 * Organizadores (ainda MOCK, até confirmar nomes/fotos reais) e voluntários (reais, ver abaixo) do
 * DevFest Campinas 2026. `type` distingue organizador de voluntário (mesmo grid/card, só filtra em
 * 2 seções na página Time). `social` aceita qualquer rede — cada item vira 1 ícone.
 *
 * `photo` é a URL final (ou "" pra cair no fallback de iniciais de components/avatar.js — é assim que
 * os voluntários sem foto ainda aparecem, sem precisar de imagem placeholder nenhuma). Organizadores
 * mock passam `mockPhoto(id)` explicitamente; quando o nome/foto real chegar, troca só o `photo` aqui.
 */
const socialLinks = {
  linkedin: { name: "linkedin", link: MOCK_LINKEDIN_URL },
  facebook: { name: "facebook", link: MOCK_FACEBOOK_URL },
};

const member = (type, name, role, photo, networks = ["linkedin"]) => ({
  name,
  role,
  type,
  photo,
  social: networks.map(network => socialLinks[network]),
});

/**
 * Foto real de organizador/voluntário (assets/img/team/, ver `DevFestIA/design/build-team-photos.sh` pra gerar
 * o `.webp` a partir do arquivo original). `TEAM_PHOTO_VERSION` funciona como o `?v=` dos scripts:
 * trocar o conteúdo de uma foto sem renomear o arquivo não invalida cache de CDN/navegador.
 */
const TEAM_PHOTO_VERSION = 1;
const teamPhoto = slug => `assets/img/team/${slug}.webp?v=${TEAM_PHOTO_VERSION}`;

/**
 * Pessoa real (organizador ou voluntário) com o próprio LinkedIn — não o mock genérico de `member()`.
 * `photo` opcional: sem ela cai pra iniciais (components/avatar.js), sem precisar de placeholder.
 * `role` opcional (o card só mostra se tiver).
 */
const person = (type, name, linkedin, { role = "", photo = "" } = {}) => ({
  name,
  role,
  type,
  photo,
  social: [{ name: "linkedin", link: linkedin }],
});

/**
 * Voluntários confirmados (revisão 2026-09-29 à noite, lista de verdade do grupo do WhatsApp — a
 * primeira leva tinha gente fora da lista oficial, foi substituída inteira por esta), ver
 * DevFestIA/project-docs/PROJECT_CONTEXT.md "Time".
 */
const volunteer = (name, linkedin, photo = "") => person("voluntario", name, linkedin, { role: "Voluntário(a)", photo });

const TEAM = [
  member("organizador", "Fernanda Albuquerque", "Direção Geral", mockPhoto(47), ["facebook", "linkedin"]),
  member("organizador", "Rodrigo Menezes", "Curadoria de Conteúdo", mockPhoto(66)),
  member("organizador", "Patrícia Lacerda", "Comunicação e Marketing", mockPhoto(48), ["facebook", "linkedin"]),
  member("organizador", "Bruno Cavalcanti", "Parcerias e Patrocínio", mockPhoto(63)),
  member("organizador", "Tatiane Moraes", "Operações e Logística", mockPhoto(49)),
  member("organizador", "Felipe Nascimento", "Tecnologia e Site", mockPhoto(68)),
  // Real (2026-09-29): cargo ainda não confirmado pelo Renato, ver aviso no handoff.
  person("organizador", "Renato Ramos", "https://www.linkedin.com/in/renato-ramos-95885a38", { photo: teamPhoto("renato-ramos") }),
  volunteer("Paula Santos", "https://www.linkedin.com/in/paula-santos-", teamPhoto("paula-santos")),
  volunteer("João Estevão Camilo", "https://www.linkedin.com/in/joãoestevaocamilo", teamPhoto("joao-estevao-camilo")),
  volunteer("Ricardo Koiti Matsushita", "https://www.linkedin.com/in/ricardo-koiti-matsushita-545006225", teamPhoto("ricardo-koiti-matsushita")),
  // Real (2026-09-29): LinkedIn dele não veio no trecho do grupo (mandou por PV); mantido o da leva anterior, mesma pessoa.
  volunteer("Davi Andrade", "https://www.linkedin.com/in/davi-lima-4695b3211", teamPhoto("davi-andrade")),
  // Renato pediu pra deixar sem foto de propósito (2026-09-29).
  volunteer("Gustavo Costa", "https://www.linkedin.com/in/guscosta7"),
  volunteer("Leonardo Araújo", "https://www.linkedin.com/in/leonardo-am", teamPhoto("leonardo-araujo")),
  volunteer("Henrique Ferreira Rodrigues da Silva", "https://www.linkedin.com/in/henrique-ferreira-rodrigues-da-silva-302a91289", teamPhoto("henrique-ferreira-rodrigues-da-silva")),
  volunteer("Pedro Escobar Missola", "https://www.linkedin.com/in/pedromissola", teamPhoto("pedro-escobar-missola")),
  volunteer("Lorenzo da Cunha", "https://www.linkedin.com/in/lorenzodacunha", teamPhoto("lorenzo-da-cunha")),
  volunteer("Camila Fernanda Ignacio", "https://www.linkedin.com/in/camila-fernanda-ignácio-379253103", teamPhoto("camila-fernanda-ignacio")),
  volunteer("Débora Nortes", "https://www.linkedin.com/in/deboranortes", teamPhoto("debora-nortes")),
  volunteer("Felipe de Oliveira", "https://www.linkedin.com/in/felipeoliveira8", teamPhoto("felipe-de-oliveira")),
  volunteer("Mayne Gabriele da Silva", "https://www.linkedin.com/in/mayne-silva-99949428b", teamPhoto("mayne-gabriele-da-silva")),
  volunteer("Vânia Gomes Marinelli", "https://www.linkedin.com/in/vania-marinelli", teamPhoto("vania-gomes-marinelli")),
  volunteer("Henrique Ribeiro Medeiros da Silva", "https://www.linkedin.com/in/henriquermdsilva", teamPhoto("henrique-ribeiro-medeiros-da-silva")),
  // Real (2026-09-29): link colado no grupo veio cortado ("naira-ferreira-", sem o resto) — conferir com ela antes do evento.
  volunteer("Laydianne Naira", "https://www.linkedin.com/in/naira-ferreira-", teamPhoto("laydianne-naira")),
  volunteer("Joao Paulo Gomes Lima", "https://www.linkedin.com/in/joao-paulo-gomes-lima-008", teamPhoto("joao-paulo-gomes-lima")),
  volunteer("Letícia Fernandes Camargo de Campos", "https://www.linkedin.com/in/leticiafccampos", teamPhoto("leticia-fernandes-campos")),
];

const teamRepository = createRepository(TEAM, {
  getByType: type => TEAM.filter(person => person.type === type),
});
