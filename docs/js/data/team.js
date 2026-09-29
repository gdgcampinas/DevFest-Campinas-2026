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
 * Pessoa real (organizador ou voluntário) com o próprio LinkedIn — não o mock genérico de `member()`.
 * Sem foto ainda: cai pra iniciais (components/avatar.js). `role` opcional (o card só mostra se tiver).
 */
const person = (type, name, linkedin, role = "") => ({
  name,
  role,
  type,
  photo: "",
  social: [{ name: "linkedin", link: linkedin }],
});

/**
 * Voluntários confirmados (revisão 2026-09-29 à noite, lista de verdade do grupo do WhatsApp — a
 * primeira leva tinha gente fora da lista oficial, foi substituída inteira por esta), ver
 * DevFestIA/project-docs/PROJECT_CONTEXT.md "Time".
 */
const volunteer = (name, linkedin) => person("voluntario", name, linkedin, "Voluntário(a)");

const TEAM = [
  member("organizador", "Fernanda Albuquerque", "Direção Geral", mockPhoto(47), ["facebook", "linkedin"]),
  member("organizador", "Rodrigo Menezes", "Curadoria de Conteúdo", mockPhoto(66)),
  member("organizador", "Patrícia Lacerda", "Comunicação e Marketing", mockPhoto(48), ["facebook", "linkedin"]),
  member("organizador", "Bruno Cavalcanti", "Parcerias e Patrocínio", mockPhoto(63)),
  member("organizador", "Tatiane Moraes", "Operações e Logística", mockPhoto(49)),
  member("organizador", "Felipe Nascimento", "Tecnologia e Site", mockPhoto(68)),
  // Real (2026-09-29): cargo ainda não confirmado pelo Renato, ver aviso no handoff.
  person("organizador", "Renato Ramos", "https://www.linkedin.com/in/renato-ramos-95885a38"),
  volunteer("Paula Santos", "https://www.linkedin.com/in/paula-santos-"),
  volunteer("João Estevão Camilo", "https://www.linkedin.com/in/joãoestevaocamilo"),
  volunteer("Ricardo Koiti Matsushita", "https://www.linkedin.com/in/ricardo-koiti-matsushita-545006225"),
  // Real (2026-09-29): LinkedIn dele não veio no trecho do grupo (mandou por PV); mantido o da leva anterior, mesma pessoa.
  volunteer("Davi Andrade", "https://www.linkedin.com/in/davi-lima-4695b3211"),
  volunteer("Gustavo Costa", "https://www.linkedin.com/in/guscosta7"),
  volunteer("Leonardo Araújo", "https://www.linkedin.com/in/leonardo-am"),
  volunteer("Henrique Ferreira Rodrigues da Silva", "https://www.linkedin.com/in/henrique-ferreira-rodrigues-da-silva-302a91289"),
  volunteer("Pedro Escobar Missola", "https://www.linkedin.com/in/pedromissola"),
  volunteer("Lorenzo da Cunha", "https://www.linkedin.com/in/lorenzodacunha"),
  volunteer("Camila Fernanda Ignacio", "https://www.linkedin.com/in/camila-fernanda-ignácio-379253103"),
  volunteer("Felipe de Oliveira", "https://www.linkedin.com/in/felipeoliveira8"),
  volunteer("Mayne Gabriele da Silva", "https://www.linkedin.com/in/mayne-silva-99949428b"),
  volunteer("Vânia Gomes Marinelli", "https://www.linkedin.com/in/vania-marinelli"),
  volunteer("Henrique Ribeiro Medeiros da Silva", "https://www.linkedin.com/in/henriquermdsilva"),
  // Real (2026-09-29): link colado no grupo veio cortado ("naira-ferreira-", sem o resto) — conferir com ela antes do evento.
  volunteer("Laydianne Naira", "https://www.linkedin.com/in/naira-ferreira-"),
  volunteer("Joao Paulo Gomes Lima", "https://www.linkedin.com/in/joao-paulo-gomes-lima-008"),
  volunteer("Letícia Fernandes Camargo de Campos", "https://www.linkedin.com/in/leticiafccampos"),
];

const teamRepository = createRepository(TEAM, {
  getByType: type => TEAM.filter(person => person.type === type),
});
