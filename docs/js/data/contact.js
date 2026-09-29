/**
 * Contato oficial do GDG Campinas — única fonte de verdade pra e-mail, Linktree e redes, hoje repetidos
 * como string solta em footer.js e codigo-de-conduta.html. Quem precisar de um desses valores usa
 * `contactRepository.get()`, nunca escreve a URL/e-mail de novo.
 */
const CONTACT = {
  email: "gdgcampinascontato@gmail.com",
  meetup: "https://www.meetup.com/gdgcampinas/",
  instagram: "https://www.instagram.com/gdgcampinas",
  linkedin: "https://www.linkedin.com/company/gdg-campinas/",
  linktree: "https://linktr.ee/gdgcampinas",
};

const contactRepository = createRepository(CONTACT);
