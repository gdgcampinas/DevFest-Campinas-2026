/**
 * LEGENDAS dos vídeos do telão (data/mural-videos.js): como o telão toca os vídeos MUDOS, quem fala aparece em texto, desenhado pelo próprio mural por cima do vídeo (letra grande no estilo do telão,
 * adapta a qualquer proporção; o arquivo do vídeo não muda). Só dado: corrigir uma frase é editar aqui, sem refazer vídeo nem republicar a release.
 *   <id do clipe>   { cues: [{ from, to, text }] }   `from` e `to` em segundos DENTRO do clipe; `text` = a frase (até ~90 caracteres, quebra sozinha em até 2 linhas)
 *                   clipe sem entrada (ou com `cues: []`) toca sem legenda; `burned: true` avisa que o vídeo JÁ tem legenda gravada (a nossa não entra por cima, pra não duplicar)
 * Transcrição inicial pelo Whisper (modelo small, em português) e REVISADA à mão: onde a fala era incerta o texto ficou o mais seguro possível (veja DevFestIA/tools/video/captions-review.md).
 */
const MURAL_CAPTIONS = {
  "devfest-2025-abertura": { cues: [
    { from: 3.6, to: 7.0, text: "Estamos aqui hoje em Campinas, trazendo várias trilhas" },
    { from: 7.0, to: 10.3, text: "com muitas palestras de temas diferentes para o mercado." },
  ] },
  "devfest-2025-chegada": { burned: true, cues: [] },
  "devfest-2025-palco": { cues: [
    { from: 0.0, to: 6.4, text: "Eu estou aqui hoje no DevFest Campinas para apresentar um pouco sobre essa plataforma" },
    { from: 6.5, to: 9.4, text: "do Google, que é focada em dados geoespaciais." },
  ] },
  "devfest-2025-conexoes": { cues: [
    { from: 0.0, to: 4.3, text: "Todo mundo tem utilizado o Gemini de várias maneiras diferentes, como assistente," },
    { from: 4.3, to: 6.9, text: "mas como isso tem funcionado dentro das empresas?" },
    { from: 7.0, to: 12.3, text: "Hoje eu estou aqui no DevFest Campinas para falar um pouquinho sobre IA e Flutter." },
  ] },
  "devfest-2025-conversas": { cues: [
    { from: 0.0, to: 3.0, text: "sobre arquitetura de startup: como a gente cresce rápido." },
    { from: 4.6, to: 6.2, text: "Eu estou aqui no DevFest em Campinas" },
    { from: 6.2, to: 8.1, text: "para falar sobre gestão híbrida de projetos," },
    { from: 8.1, to: 10.6, text: "como a gente conecta o ágil e o tradicional." },
    { from: 11.6, to: 15.0, text: "Aqui no DevFest Campinas 2025, vou fazer uma palestra." },
  ] },
  "devfest-2025-salas": { cues: [
    { from: 0.0, to: 4.4, text: "Falando sobre segurança no front-end, porque, afinal de contas, você é um usuário" },
    { from: 4.4, to: 8.3, text: "e também um desenvolvedor, e precisa atentar às políticas e às boas práticas." },
    { from: 8.3, to: 14.8, text: "Vim aqui hoje no DevFest trazer muito sobre a eficiência operacional, onde a gente consegue acelerar." },
  ] },
  "devfest-2025-equipe": { cues: [
    { from: 0.0, to: 5.0, text: "Hoje a gente vai falar também sobre como trazer o Gemini pra cá," },
    { from: 6.5, to: 13.0, text: "que é sobre migração de carreira." },
  ] },
  "devfest-2025-aprendizado": { cues: [
    { from: 0.0, to: 6.8, text: "E como a comunicação pode ser essencial para a evolução da sua carreira?" },
    { from: 6.9, to: 11.3, text: "Hoje eu apresentei um pouquinho sobre como dados podem ajudar a nossa área profissional" },
    { from: 11.4, to: 13.0, text: "e pessoal." },
  ] },
  "devfest-2025-final": { cues: [
    { from: 0.0, to: 4.0, text: "de criar meus produtos e serviços tecnológicos pensados para pessoas." },
  ] },
};

const muralCaptionsRepository = createRepository(MURAL_CAPTIONS, {
  /** As frases do clipe (lista vazia se o clipe não tem legenda ou já vem com a legenda gravada). */
  cuesFor: clipId => (MURAL_CAPTIONS[clipId]?.burned ? [] : MURAL_CAPTIONS[clipId]?.cues ?? []),
});
