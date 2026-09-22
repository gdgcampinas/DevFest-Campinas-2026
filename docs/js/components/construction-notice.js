/**
 * Aviso genérico pra qualquer seção que ainda não tem dado real (PROD,
 * `reveal` falso): substitui o conteúdo mock por uma mensagem, em vez
 * de mostrar nomes/marcas fictícios como se já fossem os de verdade.
 * Um template só, reusado por patrocinadores, comunidades, time,
 * ingressos e grade — só a mensagem muda por parâmetro.
 */
function constructionNoticeMarkup(message = "Será revelado em breve. Time trabalhando nisso! 🚧") {
  return `<div class="construction-notice">${iconMarkup("wrench")}<p>${message}</p></div>`;
}
