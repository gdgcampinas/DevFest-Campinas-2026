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
 * Voluntários confirmados (2026-09-29), ver DevFestIA/project-docs/PROJECT_CONTEXT.md "Time". Sem foto
 * ainda: cai pra iniciais. Cada um com o próprio LinkedIn (não o mock genérico de `member()`).
 */
const volunteer = (name, linkedin) => ({
  name,
  role: "Voluntário(a)",
  type: "voluntario",
  photo: "",
  social: [{ name: "linkedin", link: linkedin }],
});

const TEAM = [
  member("organizador", "Fernanda Albuquerque", "Direção Geral", mockPhoto(47), ["facebook", "linkedin"]),
  member("organizador", "Rodrigo Menezes", "Curadoria de Conteúdo", mockPhoto(66)),
  member("organizador", "Patrícia Lacerda", "Comunicação e Marketing", mockPhoto(48), ["facebook", "linkedin"]),
  member("organizador", "Bruno Cavalcanti", "Parcerias e Patrocínio", mockPhoto(63)),
  member("organizador", "Tatiane Moraes", "Operações e Logística", mockPhoto(49)),
  member("organizador", "Felipe Nascimento", "Tecnologia e Site", mockPhoto(68)),
  volunteer("Dayane Trevisan", "https://www.linkedin.com/in/dayane-trevisan"),
  volunteer("Camila Fernanda Ignacio", "https://www.linkedin.com/in/camila-fernanda-ignácio-379253103"),
  volunteer("Débora Nortes", "https://www.linkedin.com/in/deboranortes"),
  volunteer("Briena Hermsdorff Bertoni", "https://www.linkedin.com/in/briena-h-bertoni-53171622a"),
  volunteer("Geovanna de Almeida Garcia", "https://www.linkedin.com/in/geovanna-a-garcia"),
  volunteer("Lorenzo da Cunha", "https://www.linkedin.com/in/lorenzodacunha"),
  volunteer("Gustavo Costa", "https://www.linkedin.com/in/Guscosta7"),
  volunteer("Mayne Gabriele da Silva", "https://www.linkedin.com/in/mayne-silva-99949428b"),
  volunteer("João Estevão Camilo", "https://www.linkedin.com/in/joãoestevaocamilo"),
  volunteer("Henrique Ribeiro Medeiros da Silva", "https://www.linkedin.com/in/henriquermdsilva"),
  volunteer("Felipe de Oliveira Carvalho", "https://www.linkedin.com/in/felipeoliveira8"),
  volunteer("Ricardo Koiti Matsushita", "https://www.linkedin.com/in/ricardo-koiti-matsushita-545006225"),
  volunteer("Letícia Fernandes Camargo de Campos", "https://www.linkedin.com/in/leticiafccampos"),
  volunteer("Davi Fernando Lima Andrade", "https://www.linkedin.com/in/davi-lima-4695b3211"),
  volunteer("Henrique Ferreira Rodrigues da Silva", "https://www.linkedin.com/in/henrique-ferreira-rodrigues-da-silva-302a91289"),
  volunteer("Paula Gonçalves dos Santos", "https://www.linkedin.com/in/paula-santos-"),
  volunteer("Alex Henrique Rodrigues da Silva", "https://www.linkedin.com/in/alexhenriquedev"),
  volunteer("Joao Paulo Gomes Lima", "https://www.linkedin.com/in/joao-paulo-gomes-lima-008"),
  volunteer("Vânia Gomes Marinelli", "https://www.linkedin.com/in/vania-marinelli"),
  volunteer("Giovanni de Castro Magalhães", "https://www.linkedin.com/in/giovannicastromagalhaes"),
  volunteer("Nadine Braga Cabral", "https://www.linkedin.com/in/nadine-braga-cabral"),
  volunteer("Leonardo Araújo de Moura", "https://www.linkedin.com/in/leonardo-am"),
  volunteer("Pedro Escobar Missola", "https://www.linkedin.com/in/pedromissola"),
  volunteer("Matheus Naitzki Angeloni", "https://www.linkedin.com/in/matheus-angeloni-013960227"),
];

const teamRepository = createRepository(TEAM, {
  getByType: type => TEAM.filter(person => person.type === type),
});
