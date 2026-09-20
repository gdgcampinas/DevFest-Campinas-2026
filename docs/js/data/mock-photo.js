/**
 * Foto MOCK de pessoa: banco de retratos stock (pravatar.cc), escolhido
 * por número. Único lugar que sabe montar essa URL; quando as fotos
 * reais chegarem, `photo` passa a ser o arquivo real e este arquivo
 * deixa de ser usado. Cada número foi conferido à mão (só retratos
 * adequados). Precisa carregar antes de mock-speakers.js e team.js.
 */
const MOCK_PHOTO_HOST = "https://i.pravatar.cc";

function mockPhoto(id, size = 300) {
  return `${MOCK_PHOTO_HOST}/${size}?img=${id}`;
}
