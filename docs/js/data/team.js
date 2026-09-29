/**
 * Organizadores e voluntários do DevFest Campinas 2026 — todo mundo aqui é REAL (a leva mock foi
 * substituída, ver histórico do arquivo se precisar do padrão antigo). `type` distingue organizador
 * de voluntário (mesmo grid/card, só filtra em 2 seções na página Time). `social` vira 1 ícone por rede.
 *
 * `photo` é a URL final (ou "" pra cair no fallback de iniciais de components/avatar.js — sem precisar
 * de imagem placeholder nenhuma). `linkedin` também é opcional (`""` = sem ícone ainda): quem entrou
 * na lista mas ainda não mandou a rede fica sem o badge até completar.
 */

/**
 * Foto real de organizador/voluntário (assets/img/team/, ver `DevFestIA/design/build-team-photos.sh` pra gerar
 * o `.webp` a partir do arquivo original). `TEAM_PHOTO_VERSION` funciona como o `?v=` dos scripts:
 * trocar o conteúdo de uma foto sem renomear o arquivo não invalida cache de CDN/navegador.
 */
const TEAM_PHOTO_VERSION = 1;
const teamPhoto = slug => `assets/img/team/${slug}.webp?v=${TEAM_PHOTO_VERSION}`;

/** Cor da barra do card por grupo (components/person-card.js), pra separar organizador de voluntário no
 * grid sem precisar de card diferente — mesmas cores da marca, nenhuma nova. */
const TEAM_TYPE_COLOR = { organizador: "var(--google-blue)", voluntario: "var(--accent)" };

/** Pessoa real (organizador ou voluntário). `photo` e `linkedin` opcionais: sem eles, cai pra iniciais e some o ícone.
 * `bio` (mini-bio, 1 a 3 frases) também opcional: só quem tem vira card clicável e abre o modal "Descubra mais sobre". */
const person = (type, name, { role = "", photo = "", linkedin = "", bio = "" } = {}) => ({
  name,
  role,
  type,
  photo,
  bio,
  trackColor: TEAM_TYPE_COLOR[type],
  social: linkedin ? [{ name: "linkedin", link: linkedin }] : [],
});

/**
 * Voluntários confirmados (revisão 2026-09-29 à noite, lista de verdade do grupo do WhatsApp — a
 * primeira leva tinha gente fora da lista oficial, foi substituída inteira por esta), ver
 * DevFestIA/project-docs/PROJECT_CONTEXT.md "Time".
 */
const volunteer = (name, linkedin, gender, photo = "", bio = "") => person("voluntario", name, { role: gender === "f" ? "Voluntária" : "Voluntário", photo, linkedin, bio });
/** Organizador: mesmo `person()`, só fixando o `type`. */
const organizer = (name, { role = "", photo = "", linkedin = "", bio = "" } = {}) => person("organizador", name, { role, photo, linkedin, bio });

const TEAM = [
  // Organizadores reais (2026-09-30): só 4, a leva mock inteira saiu. Cargo ainda não confirmado pelo Renato.
  organizer("Renato Ramos", { linkedin: "https://www.linkedin.com/in/renato-ramos-95885a38", photo: teamPhoto("renato-ramos") }),
  organizer("Bianca Issa"),
  organizer("Michel Salomé", { linkedin: "https://www.linkedin.com/in/michel-luis-salome-de-barros", photo: teamPhoto("michel-salome") }),
  organizer("Carlos H"),
  // Ordem pedida pelo Renato (2026-09-30): mulher, homem, alternando; os homens que sobrarem vão pro fim.
  volunteer("Paula Santos", "https://www.linkedin.com/in/paula-santos-", "f", teamPhoto("paula-santos")),
  volunteer("João Estevão Camilo", "https://www.linkedin.com/in/joãoestevaocamilo", "m", teamPhoto("joao-estevao-camilo")),
  volunteer("Camila Fernanda Ignacio", "https://www.linkedin.com/in/camila-fernanda-ignácio-379253103", "f", teamPhoto("camila-fernanda-ignacio")),
  volunteer("Ricardo Koiti Matsushita", "https://www.linkedin.com/in/ricardo-koiti-matsushita-545006225", "m", teamPhoto("ricardo-koiti-matsushita")),
  volunteer("Débora Nortes", "https://www.linkedin.com/in/deboranortes", "f", teamPhoto("debora-nortes")),
  // Real (2026-09-29): LinkedIn dele não veio no trecho do grupo (mandou por PV); mantido o da leva anterior, mesma pessoa.
  volunteer("Davi Andrade", "https://www.linkedin.com/in/davi-lima-4695b3211", "m", teamPhoto("davi-andrade")),
  volunteer("Mayne Gabriele da Silva", "https://www.linkedin.com/in/mayne-silva-99949428b", "f", teamPhoto("mayne-gabriele-da-silva")),
  volunteer("Gustavo Costa", "https://www.linkedin.com/in/guscosta7", "m", teamPhoto("gustavo-costa")),
  volunteer("Vânia Gomes Marinelli", "https://www.linkedin.com/in/vania-marinelli", "f", teamPhoto("vania-gomes-marinelli")),
  volunteer("Leonardo Araújo", "https://www.linkedin.com/in/leonardo-am", "m", teamPhoto("leonardo-araujo")),
  // Real (2026-09-29): link colado no grupo veio cortado ("naira-ferreira-", sem o resto) — conferir com ela antes do evento.
  volunteer("Laydianne Naira", "https://www.linkedin.com/in/naira-ferreira-", "f", teamPhoto("laydianne-naira")),
  volunteer("Henrique Ferreira Rodrigues da Silva", "https://www.linkedin.com/in/henrique-ferreira-rodrigues-da-silva-302a91289", "m", teamPhoto("henrique-ferreira-rodrigues-da-silva")),
  volunteer("Letícia Fernandes Camargo de Campos", "https://www.linkedin.com/in/leticiafccampos", "f", teamPhoto("leticia-fernandes-campos")),
  volunteer("Pedro Escobar Missola", "https://www.linkedin.com/in/pedromissola", "m", teamPhoto("pedro-escobar-missola")),
  volunteer("Lorenzo da Cunha", "https://www.linkedin.com/in/lorenzodacunha", "m", teamPhoto("lorenzo-da-cunha")),
  volunteer("Felipe de Oliveira", "https://www.linkedin.com/in/felipeoliveira8", "m", teamPhoto("felipe-de-oliveira")),
  volunteer("Henrique Ribeiro Medeiros da Silva", "https://www.linkedin.com/in/henriquermdsilva", "m", teamPhoto("henrique-ribeiro-medeiros-da-silva")),
  volunteer("Joao Paulo Gomes Lima", "https://www.linkedin.com/in/joao-paulo-gomes-lima-008", "m", teamPhoto("joao-paulo-gomes-lima")),
];

const teamRepository = createRepository(TEAM, {
  getByType: type => TEAM.filter(person => person.type === type),
});
